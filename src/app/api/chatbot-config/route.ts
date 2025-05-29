// src/app/api/chatbot-config/route.ts - Fixed CORS version
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const getCORSHeaders = (origin: string | null): Headers => {
  const headers = new Headers()
  
  // Always allow all origins for widget embedding
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Access-Control-Allow-Credentials', 'false')
  
  // Additional headers for better compatibility
  headers.set('Cache-Control', 'public, max-age=300') // 5 minute cache
  headers.set('Vary', 'Origin')

  return headers
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)
  console.log('CORS preflight request from:', origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const websiteId = searchParams.get('websiteId') // Add this for additional validation

    console.log('Config request:', { chatbotId, websiteId, origin })

    if (!chatbotId) {
      console.error('Missing chatbotId parameter')
      return NextResponse.json({ 
        error: 'Missing chatbotId parameter',
        debug: { chatbotId, websiteId, origin }
      }, { status: 400, headers })
    }

    const supabase = createServerClient()

    // Enhanced query with better error handling
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        config,
        is_active,
        websites (
          id,
          title,
          url
        )
      `)
      .eq('id', chatbotId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Database error',
        debug: { error: error.message, chatbotId }
      }, { status: 500, headers })
    }

    if (!chatbot) {
      console.error('Chatbot not found:', chatbotId)
      return NextResponse.json({ 
        error: 'Chatbot not found',
        debug: { chatbotId }
      }, { status: 404, headers })
    }

    if (!chatbot.is_active) {
      console.error('Chatbot inactive:', chatbotId)
      return NextResponse.json({ 
        error: 'Chatbot is not active',
        debug: { chatbotId, is_active: chatbot.is_active }
      }, { status: 403, headers })
    }

    const defaultConfig = {
      theme: 'default',
      position: 'bottom-right',
      primary_color: '#3B82F6',
      secondary_color: '#EFF6FF',
      text_color: '#1F2937',
      background_color: '#FFFFFF',
      border_radius: 12,
      avatar_style: 'bot',
      avatar_icon: '🤖',
      welcome_message: `Hello! I'm here to help you with any questions about ${chatbot.websites?.[0]?.title || 'our website'}. How can I assist you today?`,
      placeholder_text: 'Type your message...',
      animation_style: 'none',
      bubble_style: 'modern',
      show_branding: true
    }

    const config = { ...defaultConfig, ...chatbot.config }

    const response = {
      success: true,
      id: chatbot.id,
      name: chatbot.name,
      config,
      is_active: chatbot.is_active,
      welcome_message: config.welcome_message,
      theme: config.theme,
      position: config.position,
      website_id: chatbot.websites?.[0]?.id,
      website_title: chatbot.websites?.[0]?.title,
      website_url: chatbot.websites?.[0]?.url,
      debug: {
        origin,
        chatbotId,
        websiteId,
        timestamp: new Date().toISOString()
      }
    }

    console.log('Sending config response:', { chatbotId, origin, success: true })
    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('Unexpected error loading chatbot config:', error)
    return NextResponse.json({ 
      error: 'Failed to load chatbot configuration',
      debug: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        origin,
        timestamp: new Date().toISOString()
      }
    }, { status: 500, headers })
  }
}