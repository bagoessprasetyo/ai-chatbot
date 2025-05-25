import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, type, metadata = {} } = await request.json()

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or type' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user can perform this action based on their subscription
    let canProceed = false
    
    switch (type) {
      case 'conversation': {
        const { error, data } = await supabase.rpc('increment_conversation_usage', { user_uuid: userId })
        canProceed = !error && (data === true || data === 1)
        break
      }
      case 'website': {
        const { error, data } = await supabase.rpc('can_create_website', { user_uuid: userId })
        canProceed = !error && (data === true || data === 1)
        break
      }
      case 'chatbot': {
        const { error, data } = await supabase.rpc('can_create_chatbot', { user_uuid: userId })
        canProceed = !error && (data === true || data === 1)
        break
      }
      default:
        return NextResponse.json(
          { error: 'Invalid usage type' },
          { status: 400 }
        )
    }

    if (!canProceed) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', code: 'LIMIT_EXCEEDED' },
        { status: 429 }
      )
    }

    // Record the usage
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        metric_type: type,
        metric_value: 1,
        metadata,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours()
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}