/* eslint-disable @typescript-eslint/no-explicit-any */
// CREATE FILE: src/app/api/test-polar/route.ts
// CREATE FILE: src/app/api/test-polar/route.ts
import { NextResponse } from 'next/server'
import { getPolarClient } from '@/lib/polar-client'

export async function GET() {
  try {
    console.log('Testing Polar.sh connection...')
    
    // Check environment variables
    const envCheck = {
      hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
      accessTokenLength: process.env.POLAR_ACCESS_TOKEN?.length,
      starterProductId: process.env.POLAR_STARTER_PRODUCT_ID,
      professionalProductId: process.env.POLAR_PROFESSIONAL_PRODUCT_ID,
    }
    
    console.log('Environment check:', envCheck)
    
    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'POLAR_ACCESS_TOKEN not set',
        envCheck
      })
    }
    
    const polar = getPolarClient()
    
    console.log('Fetching products...')
    
    // Test: List products (no org_id needed with org token)
    const products = await polar.listProducts()
    console.log('Products found:', products.items?.length || 0)
    
    // Test: Get specific products
    const starterProductId = process.env.POLAR_STARTER_PRODUCT_ID
    const professionalProductId = process.env.POLAR_PROFESSIONAL_PRODUCT_ID
    
    let starterProduct = null
    let professionalProduct = null
    
    if (starterProductId) {
      try {
        starterProduct = await polar.getProduct(starterProductId)
        console.log('Starter product found:', starterProduct.name)
      } catch (error: any) {
        console.error('Error fetching starter product:', error.message)
      }
    }
    
    if (professionalProductId) {
      try {
        professionalProduct = await polar.getProduct(professionalProductId)
        console.log('Professional product found:', professionalProduct.name)
      } catch (error: any) {
        console.error('Error fetching professional product:', error.message)
      }
    }

    // Test checkout endpoint exploration
    console.log('Testing checkout endpoints...')
    const testCheckoutData = {
      product_id: starterProductId!,
      price_id: '403ec3fe-2ddd-4140-ba02-9500f76dba18',
      success_url: 'http://localhost:3000/test-success',
      cancel_url: 'http://localhost:3000/test-cancel',
      customer_email: 'test@example.com'
    }

    // Test if we can make the checkout request (this will fail but give us better error info)
    let checkoutError = null
    try {
      await polar.createCheckoutSession(testCheckoutData)
    } catch (error: any) {
      checkoutError = {
        message: error.message,
        status: error.status,
        response: error.response
      }
      console.log('Checkout test error:', checkoutError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Polar.sh connection successful',
      data: {
        envCheck,
        totalProducts: products.items?.length || 0,
        products: products.items?.map(p => ({
          id: p.id,
          name: p.name,
          is_recurring: p.is_recurring,
          pricesCount: p.prices?.length || 0
        })) || [],
        starterProduct: starterProduct ? {
          id: starterProduct.id,
          name: starterProduct.name,
          pricesCount: starterProduct.prices?.length || 0,
          prices: starterProduct.prices?.map(p => ({
            id: p.id,
            amount: p.price_amount,
            currency: p.price_currency,
            type: p.type,
            recurring_interval: p.recurring_interval
          }))
        } : null,
        professionalProduct: professionalProduct ? {
          id: professionalProduct.id,
          name: professionalProduct.name,
          pricesCount: professionalProduct.prices?.length || 0,
          prices: professionalProduct.prices?.map(p => ({
            id: p.id,
            amount: p.price_amount,
            currency: p.price_currency,
            type: p.type,
            recurring_interval: p.recurring_interval
          }))
        } : null,
        checkoutTest: {
          attempted: true,
          error: checkoutError
        }
      }
    })
    
  } catch (error: any) {
    console.error('Polar.sh test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        status: error.status,
        response: error.response
      }
    }, { status: 500 })
  }
}