// src/app/api/webhooks/polar/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlanLimits } from '@/lib/polar-client'

// Polar.sh webhook events
interface PolarWebhookEvent {
  type: string
  data: {
    id: string
    [key: string]: any
  }
}

export async function POST(request: NextRequest) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    
    try {
      const body = await request.json()
      
      if (body.type === 'order.created') {
        const { data } = body
        const userId = data.metadata?.userId
        const planId = data.metadata?.planId
        
        if (userId && planId) {
          // Insert subscription
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            polar_customer_id: data.subscription?.customer_id,
            polar_subscription_id: data.subscription?.id,
            monthly_conversations_limit: planId === 'starter' ? 500 : 100,
            websites_limit: 1,
            chatbots_limit: planId === 'starter' ? 2 : 1,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
  
          // Insert billing
          await supabase.from('billing_history').insert({
            user_id: userId,
            polar_order_id: data.id,
            amount_paid: data.amount || 2900,
            currency: 'usd',
            status: 'paid',
            created_at: new Date().toISOString()
          })
        }
      }
      
      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error('Webhook error:', error)
      return NextResponse.json({ error: error.message })
    }
}

async function handleOrderCreated(orderData: any, supabase: any) {
  console.log('🛒 Processing order.created:', orderData.id)
  
  try {
    // Extract user and plan info from metadata
    const userId = orderData.metadata?.userId
    const planId = orderData.metadata?.planId
    const subscription = orderData.subscription
    
    console.log('📋 Order metadata:', { userId, planId })
    console.log('📋 Has subscription:', !!subscription)
    
    if (!userId || !planId) {
      console.log('⚠️ Missing userId or planId in order metadata')
      return
    }

    // If order has an active subscription, update our database
    if (subscription && subscription.status === 'active') {
      console.log('🔄 Updating subscription from order.created')
      
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          polar_customer_id: subscription.customer_id,
          polar_subscription_id: subscription.id,
          polar_product_id: subscription.product_id,
          plan_id: planId,
          status: 'active',
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at,
          ...getPlanLimits(planId),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        console.error('❌ Failed to upsert subscription:', upsertError)
        throw upsertError
      } else {
        console.log('✅ Subscription updated successfully from order')
      }
    }

    // Add to billing history
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: userId,
        polar_order_id: orderData.id,
        amount_paid: orderData.amount,
        currency: orderData.currency || 'usd',
        status: orderData.paid ? 'paid' : 'pending',
        paid_at: orderData.paid ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })

    if (billingError) {
      console.error('❌ Failed to create billing history:', billingError)
      // Don't throw here - billing history is less critical
    } else {
      console.log('✅ Billing history created successfully')
    }

  } catch (error: any) {
    console.error('❌ Error processing order.created:', error)
    throw error
  }
}

async function handleSubscriptionChange(subscriptionData: any, supabase: any) {
  console.log('📝 Processing subscription change:', subscriptionData.id)
  
  try {
    // Extract plan info from metadata
    const planId = subscriptionData.metadata?.planId
    const userId = subscriptionData.metadata?.userId
    
    if (!userId || !planId) {
      console.log('⚠️ Missing userId or planId in subscription metadata')
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        polar_customer_id: subscriptionData.customer_id,
        polar_subscription_id: subscriptionData.id,
        polar_product_id: subscriptionData.product_id,
        plan_id: planId,
        status: subscriptionData.status,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        canceled_at: subscriptionData.canceled_at,
        ...getPlanLimits(planId),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('❌ Failed to update subscription:', error)
      throw error
    } else {
      console.log('✅ Subscription updated successfully')
    }
  } catch (error: any) {
    console.error('❌ Error processing subscription change:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(subscriptionData: any, supabase: any) {
  console.log('❌ Processing subscription cancellation:', subscriptionData.id)
  
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('polar_subscription_id', subscriptionData.id)

    if (error) {
      console.error('❌ Failed to cancel subscription:', error)
      throw error
    } else {
      console.log('✅ Subscription cancelled successfully')
    }
  } catch (error: any) {
    console.error('❌ Error processing subscription cancellation:', error)
    throw error
  }
}

async function handleCheckoutCompleted(checkoutData: any, supabase: any) {
  console.log('🎉 Processing checkout completion:', checkoutData.id)
  
  try {
    const userId = checkoutData.metadata?.userId
    const planId = checkoutData.metadata?.planId
    
    if (!userId || !planId) {
      console.log('⚠️ Missing userId or planId in checkout metadata')
      return
    }

    // The subscription should be created by now, just ensure it's in our database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        polar_customer_id: checkoutData.customer_id,
        plan_id: planId,
        status: 'active',
        ...getPlanLimits(planId),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('❌ Failed to upsert subscription from checkout:', error)
      throw error
    } else {
      console.log('✅ Subscription ensured from checkout completion')
    }
  } catch (error: any) {
    console.error('❌ Error processing checkout completion:', error)
    throw error
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Polar webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}