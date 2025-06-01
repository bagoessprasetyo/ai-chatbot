// src/app/api/chat/conversation/route.ts - Save conversations with anonymous access
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with anonymous access for external widget usage
function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist session for API routes
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

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

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate contact info
    if (!contactInfo.name || !contactInfo.email) {
      return NextResponse.json(
        { error: 'Contact info must include name and email' },
        { status: 400 }
      )
    }

    const supabase = createAnonClient()

    // Check if conversation already exists
    const { data: existingConversation, error: selectError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('chatbot_id', chatbotId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

    if (selectError) {
      console.error('Error checking existing conversation:', selectError)
      return NextResponse.json(
        { error: 'Failed to check existing conversation' },
        { status: 500 }
      )
    }

    if (existingConversation) {
      // Update existing conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          messages: messages,
          updated_at: new Date().toISOString(),
          // Update contact info if provided
          contact_name: contactInfo.name,
          contact_email: contactInfo.email,
          contact_notes: contactInfo.notes || null
        })
        .eq('id', existingConversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
        return NextResponse.json(
          { error: 'Failed to update conversation', details: updateError.message },
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
          { error: 'Failed to create conversation', details: insertError.message },
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const supabase = createAnonClient()

    // Get conversation by session ID and chatbot ID
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('chatbot_id', chatbotId)
      .maybeSingle() // Use maybeSingle to avoid errors when no rows found

    if (error) {
      console.error('Error fetching conversation:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      conversation: conversation || null 
    })

  } catch (error) {
    console.error('Error in conversation GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}