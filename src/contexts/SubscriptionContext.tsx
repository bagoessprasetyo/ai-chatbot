// src/contexts/SubscriptionContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

// Types for subscription data
export interface SubscriptionData {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing'
  trial_start: string | null
  trial_end: string | null
  monthly_conversations_limit: number
  monthly_conversations_used: number
  websites_limit: number
  chatbots_limit: number
  plan_name: string
  features: string[]
  limits: {
    storage: string
    apiCalls: number
    chatbots: number
    websites: number
    monthlyConversations: number
  }
  websites_used: number
  chatbots_used: number
  websites_remaining: number
  chatbots_remaining: number
  conversations_remaining: number
  created_at: string
  updated_at: string
}

export interface SubscriptionContextType {
  // Data
  subscription: SubscriptionData | null
  loading: boolean
  error: string | null

  // Usage calculations
  getUsagePercentage: (type: 'conversations' | 'websites' | 'chatbots') => number
  getRemainingQuota: (type: 'conversations' | 'websites' | 'chatbots') => number
  
  // Limit checks
  canCreateWebsite: () => boolean
  canCreateChatbot: () => boolean
  canSendMessage: () => boolean
  
  // Trial info
  isTrialActive: () => boolean
  getTrialDaysRemaining: () => number
  isTrialExpired: () => boolean
  
  // Plan info
  getCurrentPlan: () => string
  isFreePlan: () => boolean
  isPaidPlan: () => boolean
  
  // Actions
  refreshSubscription: () => Promise<void>
  shouldShowUpgradePrompt: () => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Fetch from the user_subscription_summary view which has all the data we need
      const { data, error: fetchError } = await supabase
        .from('user_subscription_summary')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No subscription found, user will get a free trial when they first interact
          setSubscription(null)
        } else {
          throw fetchError
        }
      } else {
        setSubscription(data)
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  // Usage calculations
  const getUsagePercentage = (type: 'conversations' | 'websites' | 'chatbots'): number => {
    if (!subscription) return 0

    switch (type) {
      case 'conversations':
        return subscription.monthly_conversations_limit > 0 
          ? Math.min((subscription.monthly_conversations_used / subscription.monthly_conversations_limit) * 100, 100)
          : 0
      case 'websites':
        return subscription.websites_limit > 0 && subscription.websites_limit !== -1
          ? Math.min((subscription.websites_used / subscription.websites_limit) * 100, 100)
          : 0
      case 'chatbots':
        return subscription.chatbots_limit > 0 && subscription.chatbots_limit !== -1
          ? Math.min((subscription.chatbots_used / subscription.chatbots_limit) * 100, 100)
          : 0
      default:
        return 0
    }
  }

  const getRemainingQuota = (type: 'conversations' | 'websites' | 'chatbots'): number => {
    if (!subscription) return 0

    switch (type) {
      case 'conversations':
        return Math.max(subscription.conversations_remaining, 0)
      case 'websites':
        return subscription.websites_limit === -1 ? 999999 : Math.max(subscription.websites_remaining, 0)
      case 'chatbots':
        return subscription.chatbots_limit === -1 ? 999999 : Math.max(subscription.chatbots_remaining, 0)
      default:
        return 0
    }
  }

  // Limit checks
  const canCreateWebsite = (): boolean => {
    if (!subscription) return true // Allow first creation to trigger trial
    return subscription.websites_remaining > 0
  }

  const canCreateChatbot = (): boolean => {
    if (!subscription) return true // Allow first creation to trigger trial
    return subscription.chatbots_remaining > 0
  }

  const canSendMessage = (): boolean => {
    if (!subscription) return true // Allow first message to trigger trial
    return subscription.conversations_remaining > 0 && !isTrialExpired()
  }

  // Trial info
  const isTrialActive = (): boolean => {
    if (!subscription) return false
    return subscription.status === 'trialing'
  }

  const getTrialDaysRemaining = (): number => {
    if (!subscription || !subscription.trial_end || subscription.status !== 'trialing') return 0
    
    const now = new Date()
    const trialEnd = new Date(subscription.trial_end)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(diffDays, 0)
  }

  const isTrialExpired = (): boolean => {
    if (!subscription || subscription.status !== 'trialing') return false
    if (!subscription.trial_end) return false
    
    return new Date() > new Date(subscription.trial_end)
  }

  // Plan info
  const getCurrentPlan = (): string => {
    return subscription?.plan_name || 'Free'
  }

  const isFreePlan = (): boolean => {
    return subscription?.plan_id === 'free'
  }

  const isPaidPlan = (): boolean => {
    return subscription?.plan_id !== 'free' && subscription?.status === 'active'
  }

  // Actions
  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  const shouldShowUpgradePrompt = (): boolean => {
    if (!subscription) return false

    // Show upgrade prompt if:
    // 1. On free plan
    // 2. Trial is expiring soon (3 days or less)
    // 3. Usage is high (80% or more on any metric)
    // 4. At or over limits

    if (isFreePlan()) return true

    const trialDaysRemaining = getTrialDaysRemaining()
    if (trialDaysRemaining > 0 && trialDaysRemaining <= 3) return true

    const conversationUsage = getUsagePercentage('conversations')
    const websiteUsage = getUsagePercentage('websites')
    const chatbotUsage = getUsagePercentage('chatbots')

    if (conversationUsage >= 80 || websiteUsage >= 80 || chatbotUsage >= 80) return true

    // Check if at limits
    if (!canCreateWebsite() || !canCreateChatbot() || !canSendMessage()) return true

    return false
  }

  const contextValue: SubscriptionContextType = {
    // Data
    subscription,
    loading,
    error,

    // Usage calculations
    getUsagePercentage,
    getRemainingQuota,

    // Limit checks
    canCreateWebsite,
    canCreateChatbot,
    canSendMessage,

    // Trial info
    isTrialActive,
    getTrialDaysRemaining,
    isTrialExpired,

    // Plan info
    getCurrentPlan,
    isFreePlan,
    isPaidPlan,

    // Actions
    refreshSubscription,
    shouldShowUpgradePrompt
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}