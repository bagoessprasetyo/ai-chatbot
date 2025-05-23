/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const websiteId = searchParams.get('website_id')
    const chatbotId = searchParams.get('chatbot_id')

    let query = supabase
      .from('usage_summary')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)

    if (websiteId) {
      query = query.eq('website_id', websiteId)
    }

    if (chatbotId) {
      query = query.eq('chatbot_id', chatbotId)
    }

    const { data: usage, error } = await query.order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json(usage)

  } catch (error: any) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { user_id, website_id, chatbot_id, metric_type = 'conversation', metric_value = 1 } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Call the database function to increment usage
    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: user_id,
      p_website_id: website_id || null,
      p_chatbot_id: chatbot_id || null,
      p_metric_type: metric_type,
      p_metric_value: metric_value
    })

    if (error) throw error

    // Also update subscription usage if it's a conversation
    if (metric_type === 'conversation') {
      const { error: subError } = await supabase.rpc('sql', {
        query: `
          UPDATE subscriptions 
          SET monthly_conversations_used = monthly_conversations_used + $1
          WHERE user_id = $2
        `,
        params: [metric_value, user_id]
      })

      if (subError) {
        console.error('Error updating subscription usage:', subError)
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error tracking usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}