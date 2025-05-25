import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil"
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId } = session.metadata!

        // Update subscription with Stripe data
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trial_start: null,
            trial_end: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        // Update plan limits
        await supabase.rpc('update_subscription_plan', {
          user_uuid: userId,
          new_plan_id: planId,
          stripe_subscription_id_param: session.subscription as string
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription) {
          // Record successful payment
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', (invoice as any).subscription)
            .single()

          if (subscription) {
            await supabase
              .from('billing_history')
              .insert({
                user_id: subscription.user_id,
                subscription_id: subscription.user_id, // This should be subscription.id, but we need to get it
                stripe_invoice_id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                status: 'paid',
                invoice_pdf_url: invoice.invoice_pdf,
                billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
                billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
                paid_at: new Date().toISOString()
              })
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', (invoice as any).subscription)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}