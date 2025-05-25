// src/hooks/useSubscriptionLimits.ts
'use client'

import { useSubscription } from '@/contexts/SubscriptionContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // Assuming you're using sonner for notifications

export function useSubscriptionLimits() {
  const router = useRouter()
  const {
    canCreateWebsite,
    canCreateChatbot, 
    canSendMessage,
    subscription,
    getUsagePercentage,
    shouldShowUpgradePrompt
  } = useSubscription()

  const checkWebsiteLimit = (redirectOnFail = true) => {
    if (!canCreateWebsite()) {
      toast.error('Website limit reached', {
        description: 'Upgrade your plan to create more websites',
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/dashboard/settings?tab=billing')
        }
      })
      
      if (redirectOnFail) {
        router.push('/dashboard/settings?tab=billing')
      }
      
      return false
    }
    return true
  }

  const checkChatbotLimit = (redirectOnFail = true) => {
    if (!canCreateChatbot()) {
      toast.error('Chatbot limit reached', {
        description: 'Upgrade your plan to create more chatbots',
        action: {
          label: 'Upgrade', 
          onClick: () => router.push('/dashboard/settings?tab=billing')
        }
      })
      
      if (redirectOnFail) {
        router.push('/dashboard/settings?tab=billing')
      }
      
      return false
    }
    return true
  }

  const checkConversationLimit = (showToast = true) => {
    if (!canSendMessage()) {
      if (showToast) {
        toast.error('Conversation limit reached', {
          description: 'Upgrade your plan for more monthly conversations',
          action: {
            label: 'Upgrade',
            onClick: () => router.push('/dashboard/settings?tab=billing')
          }
        })
      }
      return false
    }
    return true
  }

  const warnIfNearLimit = (type: 'websites' | 'chatbots' | 'conversations') => {
    const usage = getUsagePercentage(type)
    
    if (usage >= 90) {
      const typeLabel = type.slice(0, -1) // Remove 's' for singular form
      toast.warning(`${typeLabel} limit almost reached`, {
        description: `You've used ${usage.toFixed(0)}% of your ${type} quota`,
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/dashboard/settings?tab=billing')
        }
      })
    }
  }

  return {
    checkWebsiteLimit,
    checkChatbotLimit,
    checkConversationLimit,
    warnIfNearLimit,
    shouldShowUpgradePrompt: shouldShowUpgradePrompt()
  }
}

// src/hooks/useSubscriptionAnalytics.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface UsageAnalytics {
  dailyConversations: Array<{ date: string; count: number }>
  weeklyConversations: Array<{ week: string; count: number }>
  monthlyConversations: Array<{ month: string; count: number }>
  topPerformingChatbots: Array<{ chatbot_id: string; name: string; conversations: number }>
  averageResponseTime: number
  totalConversationsThisMonth: number
  conversationGrowth: number
}

export function useSubscriptionAnalytics() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchAnalytics = async () => {
      try {
        const supabase = createClient()
        
        // Get daily conversations for the last 30 days
        const { data: dailyData } = await supabase
          .from('usage_analytics')
          .select('date, metric_value')
          .eq('user_id', user.id)
          .eq('metric_type', 'conversation')
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: true })

        // Get weekly conversations for the last 12 weeks
        const { data: weeklyData } = await supabase
          .rpc('get_weekly_conversations', { user_uuid: user.id })

        // Get monthly conversations for the last 12 months  
        const { data: monthlyData } = await supabase
          .rpc('get_monthly_conversations', { user_uuid: user.id })

        // Get top performing chatbots
        // You need to create a Postgres function (RPC) that returns the top performing chatbots with their conversation counts.
        // For now, let's assume you have a function called 'get_top_performing_chatbots' that takes user_uuid and returns the needed data.
        const { data: topChatbots } = await supabase
          .rpc('get_top_performing_chatbots', {
            user_uuid: user.id,
            from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            limit_count: 5
          })

        // Calculate this month's conversations
        const thisMonth = new Date()
        thisMonth.setDate(1)
        const { data: thisMonthData } = await supabase
          .from('usage_analytics')
          .select('metric_value')
          .eq('user_id', user.id)
          .eq('metric_type', 'conversation')
          .gte('date', thisMonth.toISOString().split('T')[0])

        // Calculate last month's conversations for growth
        const lastMonth = new Date(thisMonth)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const { data: lastMonthData } = await supabase
          .from('usage_analytics')
          .select('metric_value')
          .eq('user_id', user.id)
          .eq('metric_type', 'conversation')
          .gte('date', lastMonth.toISOString().split('T')[0])
          .lt('date', thisMonth.toISOString().split('T')[0])

        const thisMonthTotal = thisMonthData?.reduce((sum, item) => sum + item.metric_value, 0) || 0
        const lastMonthTotal = lastMonthData?.reduce((sum, item) => sum + item.metric_value, 0) || 0
        const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

        setAnalytics({
          dailyConversations: dailyData?.map(item => ({ 
            date: item.date, 
            count: item.metric_value 
          })) || [],
          weeklyConversations: weeklyData || [],
          monthlyConversations: monthlyData || [],
          topPerformingChatbots: topChatbots?.map((item: { chatbot_id: any; chatbots: { name: any }; count: any }) => ({
            chatbot_id: item.chatbot_id,
            name: item.chatbots?.name || 'Unknown',
            conversations: item.count
          })) || [],
          averageResponseTime: 0.8, // This would come from actual response time tracking
          totalConversationsThisMonth: thisMonthTotal,
          conversationGrowth: growth
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  return { analytics, loading }
}

// src/hooks/useSubscriptionBilling.ts
