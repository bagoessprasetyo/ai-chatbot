// src/app/api/chat/conversation/route.ts - Fixed with proper CORS headers
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

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
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
      const response = NextResponse.json(
        { error: 'Missing required fields: chatbotId, sessionId, messages, contactInfo' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      const response = NextResponse.json(
        { error: 'Messages must be a non-empty array' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Validate contact info
    if (!contactInfo.name || !contactInfo.email) {
      const response = NextResponse.json(
        { error: 'Contact info must include name and email' },
        { status: 400 }
      )
      return addCorsHeaders(response)
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
      const response = NextResponse.json(
        { error: 'Failed to check existing conversation', details: selectError.message },
        { status: 500 }
      )
      return addCorsHeaders(response)
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
        const response = NextResponse.json(
          { error: 'Failed to update conversation', details: updateError.message },
          { status: 500 }
        )
        return addCorsHeaders(response)
      }

      const response = NextResponse.json({ 
        success: true, 
        action: 'updated',
        conversationId: existingConversation.id 
      })
      return addCorsHeaders(response)
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
        const response = NextResponse.json(
          { error: 'Failed to create conversation', details: insertError.message },
          { status: 500 }
        )
        return addCorsHeaders(response)
      }

      const response = NextResponse.json({ 
        success: true, 
        action: 'created',
        conversationId: newConversation.id 
      })
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Error in conversation API:', error)
    const response = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const chatbotId = searchParams.get('chatbotId')

    if (!sessionId || !chatbotId) {
      const response = NextResponse.json(
        { error: 'Missing sessionId or chatbotId' },
        { status: 400 }
      )
      return addCorsHeaders(response)
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
      const response = NextResponse.json(
        { error: 'Failed to fetch conversation', details: error.message },
        { status: 500 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ 
      success: true, 
      conversation: conversation || null 
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Error in conversation GET API:', error)
    const response = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}