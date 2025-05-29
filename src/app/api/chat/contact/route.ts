// src/app/api/chat/contact/route.ts - Contact endpoint for saving user information
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

interface ContactInfo {
  name: string
  email: string
  notes?: string
}

interface ContactRequest {
  chatbotId: string
  sessionId: string
  contactInfo: ContactInfo
}

const getCORSHeaders = (origin: string | null): Headers => {
  const headers = new Headers()
  
  // Always allow all origins for widget embedding
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Access-Control-Allow-Credentials', 'false')
  
  // Additional headers for better compatibility
  headers.set('Cache-Control', 'public, max-age=300')
  headers.set('Vary', 'Origin')

  return headers
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { chatbotId, sessionId, contactInfo }: ContactRequest = await request.json()
    
    if (!chatbotId || !sessionId || !contactInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: chatbotId, sessionId, or contactInfo' },
        { status: 400, headers }
      )
    }

    if (!contactInfo.name || !contactInfo.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400, headers }
      )
    }

    console.log(`📧 Contact info for session ${sessionId}:`, contactInfo.email)

    const supabase = createServerClient()

    // Verify chatbot exists
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id, is_active')
      .eq('id', chatbotId)
      .eq('is_active', true)
      .single()

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404, headers }
      )
    }

    // Save or update conversation with contact info
    const { error: conversationError } = await supabase
      .from('conversations')
      .upsert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        contact_info: contactInfo,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'chatbot_id,session_id'
      })

    if (conversationError) {
      console.error('Error saving contact info:', conversationError)
      return NextResponse.json(
        { error: 'Failed to save contact information' },
        { status: 500, headers }
      )
    }

    console.log('✅ Contact info saved successfully')

    return NextResponse.json({
      success: true,
      message: 'Contact information saved successfully'
    }, { headers })

  } catch (error: any) {
    console.error('💥 Contact API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500, headers }
    )
  }
}