// src/app/api/debug/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    // Check current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Check billing history
    const { data: billing, error: billError } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', userId)

    // Check if user_subscription_summary view exists
    const { data: summary, error: summaryError } = await supabase
      .from('user_subscription_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      userId,
      subscription: { data: currentSub, error: subError?.message },
      billing: { data: billing, error: billError?.message },
      summary: { data: summary, error: summaryError?.message },
      issues: {
        noSubscription: !currentSub,
        noBilling: !billing?.length,
        noSummaryView: !!summaryError
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Fix subscription sync
export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    // Force refresh subscription data
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: 'starter',
        status: 'active',
        polar_customer_id: '23ddb815-b135-43f4-bf73-324e085971db',
        polar_subscription_id: 'd6d4f409-fd64-4e90-9d11-d38864217904',
        monthly_conversations_limit: 500,
        monthly_conversations_used: 0,
        websites_limit: 1,
        chatbots_limit: 2,
        current_period_start: '2025-05-29T06:30:03Z',
        current_period_end: '2025-06-29T06:30:03Z',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()

    return NextResponse.json({ 
      success: !error, 
      data: updated, 
      error: error?.message 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}