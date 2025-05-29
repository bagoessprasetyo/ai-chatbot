// src/app/api/debug-503/route.ts - Use service role
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
    { auth: { persistSession: false } }
  )
  
  try {
    // Insert subscription
    const { data: subResult, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: 'a37a7ccb-fdc4-4b1d-83e2-5f41d085c457',
        plan_id: 'starter',
        status: 'active',
        polar_customer_id: '23ddb815-b135-43f4-bf73-324e085971db',
        polar_subscription_id: 'd6d4f409-fd64-4e90-9d11-d38864217904',
        monthly_conversations_limit: 500,
        websites_limit: 1,
        chatbots_limit: 2,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    // Insert billing
    const { data: billResult, error: billError } = await supabase
      .from('billing_history')
      .insert({
        user_id: 'a37a7ccb-fdc4-4b1d-83e2-5f41d085c457',
        polar_order_id: '4b6dfe60-29d4-4540-8de4-ba6135aea777',
        amount_paid: 2900,
        currency: 'usd',
        status: 'paid',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      subscription: { success: !subError, error: subError?.message },
      billing: { success: !billError, error: billError?.message }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}