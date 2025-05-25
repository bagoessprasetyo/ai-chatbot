import { useState } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useSubscriptionBilling() {
  const { user } = useAuth()
  const { subscription, refreshSubscription } = useSubscription()
  const [loading, setLoading] = useState(false)

  const createCheckoutSession = async (planId: string) => {
    if (!user) throw new Error('User not authenticated')
    
    setLoading(true)
    try {
      // In a real app, this would call your API to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id })
      })
      
      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createCustomerPortalSession = async () => {
    if (!user || !subscription?.stripe_customer_id) {
      throw new Error('No customer ID found')
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripe_customer_id })
      })
      
      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      throw new Error('No subscription ID found')
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.stripe_subscription_id })
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }
      
      await refreshSubscription()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentMethod = async () => {
    return createCustomerPortalSession()
  }

  return {
    createCheckoutSession,
    createCustomerPortalSession,
    cancelSubscription,
    updatePaymentMethod,
    loading
  }
}

// src/hooks/useTrialExtension.ts
export function useTrialExtension() {
  const { subscription, refreshSubscription } = useSubscription()
  const [loading, setLoading] = useState(false)

  const requestTrialExtension = async (reason: string) => {
    if (!subscription) throw new Error('No subscription found')
    
    setLoading(true)
    try {
      const supabase = createClient()
      
      // In a real app, this might create a support ticket or send an email
      const { error } = await supabase
        .from('trial_extension_requests')
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          reason,
          status: 'pending'
        })
      
      if (error) throw error
      
      return { success: true, message: 'Trial extension request submitted' }
    } catch (error) {
      console.error('Error requesting trial extension:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const extendTrial = async (days: number) => {
    if (!subscription) throw new Error('No subscription found')
    
    setLoading(true)
    try {
      const supabase = createClient()
      const newTrialEnd = new Date(subscription.trial_end ?? Date.now())
      newTrialEnd.setDate(newTrialEnd.getDate() + days)
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ trial_end: newTrialEnd.toISOString() })
        .eq('id', subscription.id)
      
      if (error) throw error
      
      await refreshSubscription()
      return { success: true, message: `Trial extended by ${days} days` }
    } catch (error) {
      console.error('Error extending trial:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    requestTrialExtension,
    extendTrial,
    loading
  }
}