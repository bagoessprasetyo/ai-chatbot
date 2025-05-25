// src/app/api/chatbots/[id]/config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

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

    // Create Supabase client with user session
    const cookieStore = cookies()
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

    // Update the chatbot configuration
    const { error: updateError } = await supabase
      .from('chatbots')
      .update({
        config: config,
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

    return NextResponse.json(
      { success: true, message: 'Chatbot configuration updated successfully' },
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

    return NextResponse.json({
      id: chatbot.id,
      name: chatbot.name,
      config: chatbot.config,
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