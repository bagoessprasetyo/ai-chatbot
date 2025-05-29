/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/create-polar-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPolarClient, POLAR_PLAN_MAPPING, getPlanLimits } from '@/lib/polar-client'

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing planId or userId' },
        { status: 400 }
      )
    }

    // Skip checkout for free plan
    if (planId === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout' },
        { status: 400 }
      )
    }

    const planConfig = POLAR_PLAN_MAPPING[planId as keyof typeof POLAR_PLAN_MAPPING]
    if (!planConfig || !planConfig.product_id || !planConfig.price_id) {
      return NextResponse.json(
        { error: 'Invalid plan ID or product not configured' },
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

    // Debug: Log environment variables (without sensitive data)
    console.log('Environment check:', {
      hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
      starterProductId: process.env.POLAR_STARTER_PRODUCT_ID,
      professionalProductId: process.env.POLAR_PROFESSIONAL_PRODUCT_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      planId: planId,
      selectedProductId: planConfig.product_id,
      selectedPriceId: planConfig.price_id
    })

    // Fix undefined NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('Using base URL:', baseUrl)

    // Get or create customer in Polar
    let customerId: string
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('polar_customer_id')
      .eq('user_id', userId)
      .single()

    if (subscription?.polar_customer_id) {
      customerId = subscription.polar_customer_id
      console.log(`Using existing customer: ${customerId}`)
    } else {
      // Try to find existing customer first
      try {
        const customers = await polar.listCustomers()
        const existingCustomer = customers.items.find(c => c.email === user.email)
        
        if (existingCustomer) {
          customerId = existingCustomer.id
          console.log(`Found existing customer: ${customerId}`)
          
          // Update our database with the existing customer ID
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              polar_customer_id: customerId,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
        } else {
          // Create new customer only if one doesn't exist
          const customer = await polar.createCustomer({
            email: user.email!,
            name: user.user_metadata?.full_name || user.email!
          })
          customerId = customer.id
          console.log(`Created new customer: ${customerId}`)
        }
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.response?.detail?.[0]?.msg?.includes('already exists')) {
          // If we get "already exists" error, try to find the customer
          console.log('Customer exists, finding existing customer...')
          const customers = await polar.listCustomers()
          const existingCustomer = customers.items.find(c => c.email === user.email)
          
          if (existingCustomer) {
            customerId = existingCustomer.id
            console.log(`Found existing customer after error: ${customerId}`)
          } else {
            throw new Error('Customer exists but could not be found. Please contact support.')
          }
        } else {
          throw error
        }
      }
    }

    // Verify the product exists and get its details
    let product
    try {
      product = await polar.getProduct(planConfig.product_id)
      console.log(`Found product: ${product.name}`)
    } catch (error) {
      return NextResponse.json(
        { error: `Product not found for plan: ${planConfig.name}` },
        { status: 404 }
      )
    }

    // Create checkout session - try the single price format first
    console.log('Creating checkout session with single price format:', {
      product_price_id: planConfig.price_id,
      success_url: `${baseUrl}/dashboard/settings/billing?success=true&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
      customer_email: user.email!,
      metadata: {
        userId: userId,
        planId: planId
      }
    })

    let checkoutSession
    try {
      checkoutSession = await polar.createCheckoutSession({
        product_id: planConfig.price_id, // Single price format
        price_id: planConfig.price_id, // Single price format
        success_url: `${baseUrl}/dashboard/settings/billing?success=true&plan=${planId}`,
        cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
        customer_email: user.email!,
        metadata: {
          userId: userId,
          planId: planId
        }
      })
    } catch (singleError: any) {
      console.log('Single price format failed, trying products array format...')
      console.log('Single price error:', singleError.response)
      
      // If single price format fails, try products array format
      checkoutSession = await polar.createCheckoutSession({
        // products: [{
        product_id: planConfig.product_id!,
        price_id: planConfig.price_id,
        // }],
        success_url: `${baseUrl}/dashboard/settings/billing?success=true&plan=${planId}`,
        cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
        customer_email: user.email!,
        metadata: {
          userId: userId,
          planId: planId
        }
      })
    }

    // Update or create subscription record with customer ID and plan info
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        polar_customer_id: customerId,
        polar_product_id: planConfig.product_id,
        plan_id: planId,
        status: 'incomplete',
        ...getPlanLimits(planId),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    console.log(`Created checkout session: ${checkoutSession.id}`)

    return NextResponse.json({ 
      url: checkoutSession.url,
      session_id: checkoutSession.id,
      product_name: product.name
    })

  } catch (error: any) {
    console.error('Error creating Polar checkout session:', error)
    
    // Log detailed error information for debugging
    if (error.name === 'PolarAPIError') {
      console.error('Polar API Error Details:', {
        status: error.status,
        message: error.message,
        response: error.response
      })
      
      return NextResponse.json(
        { 
          error: `Payment system error: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? {
            status: error.status,
            response: error.response
          } : undefined
        },
        { status: error.status >= 500 ? 500 : 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// src/app/api/polar-subscription-status/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('polar_customer_id, polar_subscription_id, plan_id, status')
      .eq('user_id', userId)
      .single()

    if (!subscription?.polar_customer_id) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      })
    }

    let polarSubscription = null
    if (subscription.polar_subscription_id) {
      try {
        polarSubscription = await polar.getSubscription(subscription.polar_subscription_id)
      } catch (error: any) {
        console.log('Could not fetch Polar subscription:', error.message)
      }
    }

    return NextResponse.json({
      hasSubscription: !!subscription,
      subscription: {
        ...subscription,
        polar_subscription: polarSubscription
      }
    })

  } catch (error: any) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}