// src/app/api/chatbots/[id]/config/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { config, name } = await request.json()
    const chatbotId = params.id

    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Chatbot ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating chatbot config:', { chatbotId, config, name })

    // Create Supabase client with user session
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the user owns this chatbot
    const { data: chatbot, error: fetchError } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        config,
        websites!inner (
          user_id
        )
      `)
      .eq('id', chatbotId)
      .single()

    if (fetchError) {
      console.error('Error fetching chatbot:', fetchError)
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (chatbot.websites[0]?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Merge the new config with existing config to preserve all properties
    const existingConfig = chatbot.config || {}
    const updatedConfig = { ...existingConfig, ...config }

    console.log('Merging config:', { existingConfig, newConfig: config, updatedConfig })

    // Update the chatbot configuration
    const { error: updateError } = await supabase
      .from('chatbots')
      .update({
        config: updatedConfig,
        name: name || chatbot.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId)

    if (updateError) {
      console.error('Error updating chatbot:', updateError)
      return NextResponse.json(
        { error: 'Failed to update chatbot configuration' },
        { status: 500 }
      )
    }

    console.log('Chatbot config updated successfully')

    return NextResponse.json(
      { 
        success: true, 
        message: 'Chatbot configuration updated successfully',
        config: updatedConfig
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get chatbot configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatbotId = params.id

    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Chatbot ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get chatbot with configuration
    const { data: chatbot, error: fetchError } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        config,
        is_active,
        websites!inner (
          user_id,
          title,
          url
        )
      `)
      .eq('id', chatbotId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (chatbot.websites[0]?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Ensure complete config with defaults
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
      welcome_message: `Hello! I'm here to help you with any questions about ${chatbot.websites[0]?.title || 'our website'}. How can I assist you today?`,
      placeholder_text: 'Type your message...',
      animation_style: 'none',
      bubble_style: 'modern',
      show_branding: true
    }

    const config = { ...defaultConfig, ...chatbot.config }

    return NextResponse.json({
      id: chatbot.id,
      name: chatbot.name,
      config: config,
      is_active: chatbot.is_active,
      website: {
        title: chatbot.websites[0]?.title,
        url: chatbot.websites[0]?.url
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}