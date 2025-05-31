// src/app/api/chatbot-config/route.ts - Version with Service Role Key
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getCORSHeaders = (origin: string | null): Headers => {
  const headers = new Headers()
  
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Access-Control-Allow-Credentials', 'false')
  headers.set('Cache-Control', 'public, max-age=300')
  headers.set('Vary', 'Origin')

  return headers
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const websiteId = searchParams.get('websiteId')

    console.log('Config request:', { chatbotId, websiteId, origin })

    if (!chatbotId) {
      return NextResponse.json({ 
        error: 'Missing chatbotId parameter',
        debug: { chatbotId, websiteId, origin }
      }, { status: 400, headers })
    }

    // FIXED: Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query chatbot
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select(`
        id,
        name,
        config,
        is_active,
        website_id
      `)
      .eq('id', chatbotId)
      .eq('is_active', true)
      .single()

    if (chatbotError) {
      console.error('Chatbot query error:', chatbotError)
      
      if (chatbotError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Chatbot not found or inactive',
          debug: { chatbotId, websiteId, error: 'No active chatbot found with this ID' }
        }, { status: 404, headers })
      }
      
      return NextResponse.json({ 
        error: 'Database error',
        debug: { error: chatbotError.message, code: chatbotError.code, chatbotId }
      }, { status: 500, headers })
    }

    if (!chatbot) {
      return NextResponse.json({ 
        error: 'Chatbot not found or inactive',
        debug: { chatbotId }
      }, { status: 404, headers })
    }

    // Query website
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, title, url')
      .eq('id', chatbot.website_id)
      .single()

    if (websiteError) {
      console.error('Website query error:', websiteError)
    }

    // Validate websiteId if provided
    if (websiteId && website && website.id !== websiteId) {
      console.warn('Website ID mismatch:', { 
        providedWebsiteId: websiteId, 
        actualWebsiteId: website.id 
      })
    }

    const defaultConfig = {
      theme: 'default',
      position: 'bottom-right',
      primary_color: '#3B82F6',
      secondary_color: '#EFF6FF',
      text_color: '#1F2937',
      background_color: '#FFFFFF',
      border_radius: 12,
      avatar_style: 'bot',
      avatar_icon: 'Bot',
      welcome_message: `Hello! I'm here to help you with any questions about ${website?.title || 'our website'}. How can I assist you today?`,
      placeholder_text: 'Type your message...',
      animation_style: 'none',
      bubble_style: 'modern',
      show_branding: true
    }

    const config = { ...defaultConfig, ...chatbot.config }

    const response = {
      success: true,
      id: chatbot.id,
      name: chatbot.name,
      config,
      is_active: chatbot.is_active,
      welcome_message: config.welcome_message,
      theme: config.theme,
      position: config.position,
      website_id: website?.id || chatbot.website_id,
      website_title: website?.title || 'Website',
      website_url: website?.url || '',
      debug: {
        origin,
        chatbotId,
        websiteId,
        websiteFound: !!website,
        timestamp: new Date().toISOString()
      }
    }

    console.log('Config response successful:', { chatbotId, origin, websiteFound: !!website })
    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to load chatbot configuration',
      debug: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        origin,
        timestamp: new Date().toISOString()
      }
    }, { status: 500, headers })
  }
}