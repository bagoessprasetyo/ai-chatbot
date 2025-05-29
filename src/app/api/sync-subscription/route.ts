// src/app/api/sync-subscription/route.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPolarClient, mapPolarSubscriptionToLocal, getPlanLimits } from '@/lib/polar-client'

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const polar = getPolarClient()

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Syncing subscription for user:', userId)

    // Get current subscription to find customer ID
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('polar_customer_id')
      .eq('user_id', userId)
      .single()

    if (!currentSub?.polar_customer_id) {
      return NextResponse.json(
        { error: 'No customer ID found' },
        { status: 404 }
      )
    }

    // Get latest subscriptions from Polar
    const subscriptions = await polar.listSubscriptions(currentSub.polar_customer_id)
    
    // Find the most recent active subscription
    const activeSubscription = subscriptions.items
      .filter((sub: any) => sub.status === 'active' || sub.status === 'trialing')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (!activeSubscription) {
      console.log('⚠️ No active subscription found in Polar')
      return NextResponse.json({
        success: false,
        message: 'No active subscription found'
      })
    }

    // Map and update subscription
    const localSubscription = mapPolarSubscriptionToLocal(activeSubscription)
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        ...localSubscription,
        ...getPlanLimits(localSubscription.plan_id),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Failed to update subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription synced successfully')

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      subscription: {
        plan_id: localSubscription.plan_id,
        status: localSubscription.status
      }
    })

  } catch (error: any) {
    console.error('❌ Subscription sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()
    
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current subscription status
    const { data: subscription } = await supabase
      .from('user_subscription_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      subscription: subscription || null
    })

  } catch (error: any) {
    console.error('❌ Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}