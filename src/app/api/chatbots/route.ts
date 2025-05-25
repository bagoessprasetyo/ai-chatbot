// src/app/api/chatbots/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get chatbots for the current user
    const { data, error } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        config,
        is_active,
        created_at,
        website_id,
        websites!inner (
          title,
          url,
          user_id
        )
      `)
      .eq('websites.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chatbots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chatbots' },
        { status: 500 }
      )
    }

    // Default config for backward compatibility
    const defaultConfig = {
      theme: 'default',
      position: 'bottom-right',
      primary_color: '#3B82F6',
      secondary_color: '#EFF6FF',
      text_color: '#1F2937',
      background_color: '#FFFFFF',
      border_radius: 12,
      avatar_style: 'bot',
      welcome_message: 'Hello! How can I help you today?',
      placeholder_text: 'Type your message...',
      animation_style: 'none',
      bubble_style: 'modern',
      show_branding: true
    }

    // Format the response
    const formattedChatbots = data?.map(chatbot => ({
      id: chatbot.id,
      name: chatbot.name,
      config: { ...defaultConfig, ...chatbot.config },
      is_active: chatbot.is_active,
      created_at: chatbot.created_at,
      website_title: chatbot.websites[0].title,
      website_url: chatbot.websites[0].url,
      website_id: chatbot.website_id
    })) || []

    return NextResponse.json({
      chatbots: formattedChatbots,
      count: formattedChatbots.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}