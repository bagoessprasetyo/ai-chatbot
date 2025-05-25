// src/app/api/chatbots/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_active } = await request.json()
    const chatbotId = params.id

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

    // Update the chatbot status
    const { error: updateError } = await supabase
      .from('chatbots')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId)

    if (updateError) {
      console.error('Error updating chatbot status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update chatbot status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Chatbot ${is_active ? 'activated' : 'deactivated'} successfully`,
        is_active 
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

// src/app/api/chatbots/[id]/route.ts - For deleting chatbots
