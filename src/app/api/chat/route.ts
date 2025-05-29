/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/chat/route.ts - Updated with CORS headers and usage tracking
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

interface ChatRequest {
  chatbotId: string
  message: string
  sessionId: string
  conversationHistory?: ChatMessage[]
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const getCORSHeaders = (origin: string | null): Headers => {
  const headers = new Headers()
  
  // Always allow all origins for widget embedding
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Access-Control-Allow-Credentials', 'false')
  
  // Additional headers for better compatibility
  headers.set('Cache-Control', 'public, max-age=300')
  headers.set('Vary', 'Origin')

  return headers
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { chatbotId, message, sessionId, conversationHistory = [] }: ChatRequest = await request.json()
    
    if (!chatbotId || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: chatbotId, message, or sessionId' },
        { status: 400, headers }
      )
    }

    console.log(`💬 Chat request for chatbot ${chatbotId}:`, message.substring(0, 100))

    const supabase = createServerClient()

    // Get chatbot and website information with user details
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select(`
        *,
        websites (
          id,
          title,
          url,
          user_id,
          system_prompt
        )
      `)
      .eq('id', chatbotId)
      .eq('is_active', true)
      .single()

    if (chatbotError || !chatbot) {
      console.error('Chatbot not found:', chatbotError)
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404, headers }
      )
    }

    if (!chatbot.websites?.system_prompt) {
      return NextResponse.json(
        { error: 'Chatbot not properly configured - missing system prompt' },
        { status: 500, headers }
      )
    }

    const userId = chatbot.websites.user_id
    const websiteId = chatbot.websites.id

    // Check user's subscription and usage limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subscription) {
      // Check if user has exceeded their monthly conversation limit
      if (subscription.monthly_conversations_used >= subscription.monthly_conversations_limit) {
        return NextResponse.json(
          { 
            error: 'Monthly conversation limit reached. Please upgrade your plan to continue.',
            type: 'limit_exceeded'
          },
          { status: 429, headers }
        )
      }

      // Check if trial has expired
      if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end)
        if (new Date() > trialEnd) {
          return NextResponse.json(
            { 
              error: 'Free trial has expired. Please upgrade to continue using the service.',
              type: 'trial_expired'
            },
            { status: 402, headers }
          )
        }
      }

      // Check if subscription is active
      if (!['active', 'trialing'].includes(subscription.status)) {
        return NextResponse.json(
          { 
            error: 'Subscription is not active. Please update your payment method.',
            type: 'subscription_inactive'
          },
          { status: 402, headers }
        )
      }
    }

    // Prepare conversation for OpenAI
    const systemPrompt = chatbot.websites.system_prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Add conversation history (limit to last 10 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10)
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      }
    })

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    })

    console.log('🤖 Sending to OpenAI with', messages.length, 'messages')

    // Get AI response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    console.log('✅ OpenAI response received:', aiResponse.substring(0, 100))

    // Create the complete conversation with the new messages
    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    ]

    // Store or update conversation in database
    const { error: conversationError } = await supabase
      .from('conversations')
      .upsert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        messages: updatedHistory,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'chatbot_id,session_id'
      })

    if (conversationError) {
      console.error('Error saving conversation:', conversationError)
      // Don't fail the request if we can't save - still return the AI response
    }

    // Track usage analytics
    try {
      // Track the conversation
      await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_website_id: websiteId,
        p_chatbot_id: chatbotId,
        p_metric_type: 'conversation',
        p_metric_value: 1
      })

      // Track messages sent and received
      await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_website_id: websiteId,
        p_chatbot_id: chatbotId,
        p_metric_type: 'message_sent',
        p_metric_value: 1
      })

      await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_website_id: websiteId,
        p_chatbot_id: chatbotId,
        p_metric_type: 'message_received',
        p_metric_value: 1
      })

      // Update subscription usage count
      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({ 
            monthly_conversations_used: subscription.monthly_conversations_used + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      }

    } catch (usageError) {
      console.error('Error tracking usage:', usageError)
      // Don't fail the request if usage tracking fails
    }

    // Return the AI response
    return NextResponse.json({
      success: true,
      message: aiResponse,
      conversationHistory: updatedHistory,
      usage: subscription ? {
        used: subscription.monthly_conversations_used + 1,
        limit: subscription.monthly_conversations_limit,
        remaining: subscription.monthly_conversations_limit - subscription.monthly_conversations_used - 1
      } : undefined
    }, { headers })

  } catch (error: any) {
    console.error('💥 Chat API error:', error)

    // Handle OpenAI specific errors
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'AI service temporarily unavailable. Please try again later.',
          type: 'quota_exceeded'
        },
        { status: 503, headers }
      )
    }

    if (error?.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        { 
          error: 'Invalid request to AI service. Please try rephrasing your message.',
          type: 'invalid_request'
        },
        { status: 400, headers }
      )
    }

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        type: 'internal_error'
      },
      { status: 500, headers }
    )
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const sessionId = searchParams.get('sessionId')

    if (!chatbotId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing chatbotId or sessionId' },
        { status: 400, headers }
      )
    }

    const supabase = createServerClient()

    // Get conversation history
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('chatbot_id', chatbotId)
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      conversationHistory: conversation?.messages || []
    }, { headers })

  } catch (error: any) {
    console.error('Error retrieving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' },
      { status: 500, headers }
    )
  }
}