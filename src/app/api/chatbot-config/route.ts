// src/app/api/chatbot-config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const getCORSHeaders = (origin: string | null): Headers => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  const headers = new Headers()

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    headers.set('Access-Control-Allow-Origin', origin)
  } else {
    headers.set('Access-Control-Allow-Origin', '*') // fallback
  }

  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400') // cache preflight

  return headers
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')

    if (!chatbotId) {
      return NextResponse.json({ error: 'Missing chatbotId parameter' }, { status: 400, headers })
    }

    const supabase = createServerClient()

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
      .eq('is_active', true)
      .single()

    if (error || !chatbot) {
      return NextResponse.json({ error: 'Chatbot not found or inactive' }, { status: 404, headers })
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

    return NextResponse.json({
      id: chatbot.id,
      name: chatbot.name,
      config,
      is_active: chatbot.is_active,
      welcome_message: config.welcome_message,
      theme: config.theme,
      position: config.position,
      website_id: chatbot.websites?.[0]?.id,
      website_title: chatbot.websites?.[0]?.title,
      website_url: chatbot.websites?.[0]?.url
    }, { headers })

  } catch (error) {
    console.error('Error loading chatbot config:', error)
    return NextResponse.json({ error: 'Failed to load chatbot configuration' }, { status: 500, headers })
  }
}
