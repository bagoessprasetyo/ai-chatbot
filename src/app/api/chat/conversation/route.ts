// src/app/api/chat/conversation/route.ts - Save conversations to database
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      chatbotId, 
      sessionId, 
      messages, 
      contactInfo,
      websiteId 
    } = await request.json()

    // Validate required fields
    if (!chatbotId || !sessionId || !messages || !contactInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: chatbotId, sessionId, messages, contactInfo' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('chatbot_id', chatbotId)
      .single()

    if (existingConversation) {
      // Update existing conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          messages: messages,
          updated_at: new Date().toISOString(),
          // Update contact info if provided
          ...(contactInfo && {
            contact_name: contactInfo.name,
            contact_email: contactInfo.email,
            contact_notes: contactInfo.notes
          })
        })
        .eq('id', existingConversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
        return NextResponse.json(
          { error: 'Failed to update conversation' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        action: 'updated',
        conversationId: existingConversation.id 
      })
    } else {
      // Create new conversation
      const { data: newConversation, error: insertError } = await supabase
        .from('conversations')
        .insert({
          chatbot_id: chatbotId,
          session_id: sessionId,
          messages: messages,
          contact_name: contactInfo.name,
          contact_email: contactInfo.email,
          contact_notes: contactInfo.notes || null,
          website_id: websiteId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating conversation:', insertError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        action: 'created',
        conversationId: newConversation.id 
      })
    }

  } catch (error) {
    console.error('Error in conversation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const chatbotId = searchParams.get('chatbotId')

    if (!sessionId || !chatbotId) {
      return NextResponse.json(
        { error: 'Missing sessionId or chatbotId' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get conversation by session ID and chatbot ID
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('chatbot_id', chatbotId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No conversation found
        return NextResponse.json({ 
          success: true, 
          conversation: null 
        })
      }
      
      console.error('Error fetching conversation:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      conversation 
    })

  } catch (error) {
    console.error('Error in conversation GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}