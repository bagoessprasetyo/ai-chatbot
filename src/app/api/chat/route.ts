/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/chat/route.ts
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

// Initialize OpenAI (you'll need to add your API key to environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { chatbotId, message, sessionId, conversationHistory = [] }: ChatRequest = await request.json()
    
    if (!chatbotId || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: chatbotId, message, or sessionId' },
        { status: 400 }
      )
    }

    console.log(`💬 Chat request for chatbot ${chatbotId}:`, message.substring(0, 100))

    const supabase = createServerClient()

    // Get chatbot and website information
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select(`
        *,
        websites (
          id,
          title,
          url,
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
        { status: 404 }
      )
    }

    if (!chatbot.websites?.system_prompt) {
      return NextResponse.json(
        { error: 'Chatbot not properly configured - missing system prompt' },
        { status: 500 }
      )
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

    // Return the AI response
    return NextResponse.json({
      success: true,
      message: aiResponse,
      conversationHistory: updatedHistory
    })

  } catch (error: any) {
    console.error('💥 Chat API error:', error)

    // Handle OpenAI specific errors
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'AI service temporarily unavailable. Please try again later.',
          type: 'quota_exceeded'
        },
        { status: 503 }
      )
    }

    if (error?.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        { 
          error: 'Invalid request to AI service. Please try rephrasing your message.',
          type: 'invalid_request'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        type: 'internal_error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const sessionId = searchParams.get('sessionId')

    if (!chatbotId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing chatbotId or sessionId' },
        { status: 400 }
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
    })

  } catch (error: any) {
    console.error('Error retrieving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' },
      { status: 500 }
    )
  }
}