/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/chatbot-config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')

    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Missing chatbotId parameter' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get chatbot configuration
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
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    // Return chatbot configuration
    return NextResponse.json({
      id: chatbot.id,
      name: chatbot.name,
      welcome_message: chatbot.config?.welcome_message || `Hello! I'm here to help you with any questions about ${chatbot.websites?.[0]?.title || 'our website'}. How can I assist you today?`,
      theme: chatbot.config?.theme || 'default',
      position: chatbot.config?.position || 'bottom-right',
      website_id: chatbot.websites?.[0]?.id,
      website_title: chatbot.websites?.[0]?.title,
      website_url: chatbot.websites?.[0]?.url
    })

  } catch (error: any) {
    console.error('Error loading chatbot config:', error)
    return NextResponse.json(
      { error: 'Failed to load chatbot configuration' },
      { status: 500 }
    )
  }
}