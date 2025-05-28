// src/app/api/chatbots/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function DELETE(
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

    const supabase = createServerClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
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

    if (chatbot.websites[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the chatbot
    const { error: deleteError } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', chatbotId)

    if (deleteError) {
      console.error('Error deleting chatbot:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete chatbot' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Chatbot deleted successfully' },
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

// Handle PATCH for status updates - FIXED VERSION
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH request received for chatbot:', params.id)
    
    const { is_active } = await request.json()
    const chatbotId = params.id

    console.log('Request data:', { chatbotId, is_active })

    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Chatbot ID is required' },
        { status: 400 }
      )
    }

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Auth error:', userError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('No user found')
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // First check if chatbot exists and get website info
    const { data: chatbot, error: fetchError } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        is_active,
        website_id,
        websites!inner (
          id,
          user_id,
          title
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

    console.log('Chatbot found:', chatbot)

    // Check ownership
    if (chatbot.websites[0].user_id !== user.id) {
      console.error('Ownership check failed:', {
        chatbotOwner: chatbot.websites[0].user_id,
        currentUser: user.id
      })
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this chatbot' },
        { status: 403 }
      )
    }

    console.log('Ownership verified, updating status...')

    // Update the chatbot status
    const { data: updatedChatbot, error: updateError } = await supabase
      .from('chatbots')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId)
      .select('id, name, is_active')
      .single()

    if (updateError) {
      console.error('Error updating chatbot status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update chatbot status' },
        { status: 500 }
      )
    }

    console.log('Chatbot status updated successfully:', updatedChatbot)

    return NextResponse.json(
      { 
        success: true, 
        message: `Chatbot ${is_active ? 'activated' : 'deactivated'} successfully`,
        chatbot: updatedChatbot
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