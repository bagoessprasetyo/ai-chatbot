// src/app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
})

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing planId or userId' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      // Get user email from auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
      
      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId
        }
      })

      customerId = customer.id

      // Update subscription with customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `WebBot AI ${plan.name} Plan`
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&canceled=true`,
      metadata: {
        userId: userId,
        planId: planId
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planId: planId
        }
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// src/app/api/create-portal-session/route.ts


// src/app/api/webhooks/stripe/route.ts


// src/app/api/subscription/usage/route.ts


// src/app/api/subscription/status/route.ts
