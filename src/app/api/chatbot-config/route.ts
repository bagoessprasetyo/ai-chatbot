/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/chatbot-config/route.ts - Updated to return complete configuration
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

    // Get chatbot configuration with complete config object
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
        { error: 'Chatbot not found or inactive 1 , '+JSON.stringify(error)  },
        { status: 404 }
      )
    }

    // Ensure we have a complete config object with all required properties
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

    // Merge saved config with defaults
    const config = { ...defaultConfig, ...chatbot.config }

    // Return complete chatbot configuration
    return NextResponse.json({
      id: chatbot.id,
      name: chatbot.name,
      config: config,
      is_active: chatbot.is_active,
      
      // Legacy properties for backward compatibility
      welcome_message: config.welcome_message,
      theme: config.theme,
      position: config.position,
      
      // Website information
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