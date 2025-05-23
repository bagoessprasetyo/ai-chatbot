// src/lib/utils/plans.ts
import { PLANS, PlanFeatures, Subscription } from '@/lib/types/settings'

export function getPlanById(planId: string): PlanFeatures | undefined {
  return PLANS.find(plan => plan.id === planId)
}

export function getCurrentPlan(subscription: Subscription | null): PlanFeatures {
  if (!subscription) {
    return PLANS[0] // Return free plan as default
  }
  return getPlanById(subscription.plan_id) || PLANS[0]
}

export function formatPrice(priceInCents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInCents / 100)
}

export function formatPricePerMonth(plan: PlanFeatures): string {
  return `${formatPrice(plan.price)}${plan.price > 0 ? '/month' : ''}`
}

export function formatPricePerYear(plan: PlanFeatures): string {
  if (!plan.yearlyPrice) return ''
  return `${formatPrice(plan.yearlyPrice)}/year`
}

export function getYearlySavings(plan: PlanFeatures): { amount: number; percentage: number } | null {
  if (!plan.yearlyPrice) return null
  
  const monthlyTotal = plan.price * 12
  const savings = monthlyTotal - plan.yearlyPrice
  const percentage = Math.round((savings / monthlyTotal) * 100)
  
  return {
    amount: savings,
    percentage
  }
}

export function canUpgradeTo(currentPlan: PlanFeatures, targetPlan: PlanFeatures): boolean {
  const currentIndex = PLANS.findIndex(p => p.id === currentPlan.id)
  const targetIndex = PLANS.findIndex(p => p.id === targetPlan.id)
  
  return targetIndex > currentIndex
}

export function canDowngradeTo(currentPlan: PlanFeatures, targetPlan: PlanFeatures): boolean {
  const currentIndex = PLANS.findIndex(p => p.id === currentPlan.id)
  const targetIndex = PLANS.findIndex(p => p.id === targetPlan.id)
  
  return targetIndex < currentIndex && targetIndex >= 0
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min((used / limit) * 100, 100)
}

export function isUsageLimitReached(used: number, limit: number): boolean {
  return used >= limit
}

export function getRemainingUsage(used: number, limit: number): number {
  return Math.max(limit - used, 0)
}

export function getUsageStatus(used: number, limit: number): 'normal' | 'warning' | 'exceeded' {
  const percentage = getUsagePercentage(used, limit)
  
  if (percentage >= 100) return 'exceeded'
  if (percentage >= 80) return 'warning'
  return 'normal'
}

export function isTrialExpired(subscription: Subscription | null): boolean {
  if (!subscription || subscription.status !== 'trialing') return false
  if (!subscription.trial_end) return false
  
  return new Date() > new Date(subscription.trial_end)
}

export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!subscription || subscription.status !== 'trialing') return 0
  if (!subscription.trial_end) return 0
  
  const now = new Date()
  const trialEnd = new Date(subscription.trial_end)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(diffDays, 0)
}

export function shouldShowUpgradePrompt(subscription: Subscription | null): boolean {
  if (!subscription) return true
  
  // Show upgrade prompt if:
  // 1. On free plan
  // 2. Trial is expiring soon (3 days or less)
  // 3. Usage is high (80% or more)
  
  const currentPlan = getCurrentPlan(subscription)
  if (currentPlan.id === 'free') return true
  
  const trialDaysRemaining = getTrialDaysRemaining(subscription)
  if (trialDaysRemaining > 0 && trialDaysRemaining <= 3) return true
  
  const usagePercentage = getUsagePercentage(
    subscription.monthly_conversations_used,
    subscription.monthly_conversations_limit
  )
  if (usagePercentage >= 80) return true
  
  return false
}

export function getRecommendedPlan(currentUsage: {
  conversations: number
  websites: number
  chatbots: number
}): PlanFeatures {
  // Find the smallest plan that can accommodate the current usage
  for (const plan of PLANS.slice(1)) { // Skip free plan
    if (
      plan.conversations_limit >= currentUsage.conversations &&
      plan.websites_limit >= currentUsage.websites &&
      plan.chatbots_limit >= currentUsage.chatbots
    ) {
      return plan
    }
  }
  
  // If no plan fits, return the highest tier
  return PLANS[PLANS.length - 1]
}

// src/lib/utils/subscription-helpers.ts
export function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'trialing':
      return 'text-blue-600 bg-blue-100'
    case 'past_due':
      return 'text-yellow-600 bg-yellow-100'
    case 'cancelled':
    case 'unpaid':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getSubscriptionStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past Due'
    case 'cancelled':
      return 'Cancelled'
    case 'unpaid':
      return 'Unpaid'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getNextBillingDate(subscription: Subscription | null): string | null {
  if (!subscription || !subscription.current_period_end) return null
  return formatDate(subscription.current_period_end)
}

export function getBillingAmount(plan: PlanFeatures, isYearly: boolean = false): number {
  return isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price
}

// Usage tracking utilities
export function trackConversation(userId: string, websiteId?: string, chatbotId?: string) {
  // Fire and forget usage tracking
  fetch('/api/user/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      website_id: websiteId,
      chatbot_id: chatbotId,
      metric_type: 'conversation',
      metric_value: 1
    })
  }).catch(console.error)
}

export function trackApiCall(userId: string, websiteId?: string, chatbotId?: string) {
  fetch('/api/user/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      website_id: websiteId,
      chatbot_id: chatbotId,
      metric_type: 'api_call',
      metric_value: 1
    })
  }).catch(console.error)
}

export function trackMessage(userId: string, type: 'sent' | 'received', websiteId?: string, chatbotId?: string) {
  fetch('/api/user/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      website_id: websiteId,
      chatbot_id: chatbotId,
      metric_type: type === 'sent' ? 'message_sent' : 'message_received',
      metric_value: 1
    })
  }).catch(console.error)
}