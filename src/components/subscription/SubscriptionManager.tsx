// src/components/subscription/SubscriptionManager.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { 
  Crown, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Globe, 
  Bot, 
  MessageSquare,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

// Usage Warning Component
export function UsageWarning({ type }: { type: 'website' | 'chatbot' | 'conversation' }) {
  const { getUsagePercentage, subscription } = useSubscription()
  
  const typeMap = {
    website: 'websites',
    chatbot: 'chatbots',
    conversation: 'conversations'
  } as const
  const percentage = getUsagePercentage(typeMap[type])
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100
  
  if (!isNearLimit) return null

  const config = {
    website: {
      label: 'Website',
      icon: <Globe className="w-4 h-4" />,
      remaining: subscription?.websites_remaining || 0
    },
    chatbot: {
      label: 'Chatbot', 
      icon: <Bot className="w-4 h-4" />,
      remaining: subscription?.chatbots_remaining || 0
    },
    conversation: {
      label: 'Conversation',
      icon: <MessageSquare className="w-4 h-4" />,
      remaining: subscription?.conversations_remaining || 0
    }
  }

  const item = config[type]

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${isAtLimit ? 'border-red-200 bg-red-50' : ''}`}>
      <AlertTriangle className={`w-4 h-4 ${isAtLimit ? 'text-red-600' : 'text-orange-600'}`} />
      <AlertDescription className={isAtLimit ? 'text-red-800' : 'text-orange-800'}>
        <div className="flex items-center justify-between">
          <span>
            {isAtLimit 
              ? `${item.label} limit reached!` 
              : `${item.label} limit almost reached`
            }
            {!isAtLimit && ` (${item.remaining} remaining)`}
          </span>
          <Link href="/dashboard/settings?tab=billing">
            <Button size="sm" variant={isAtLimit ? "destructive" : "outline"}>
              Upgrade
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Plan Comparison Modal Component
interface PlanComparisonProps {
  currentPlanId: string
  onUpgrade: (planId: string) => void
}

export function PlanComparison({ currentPlanId, onUpgrade }: PlanComparisonProps) {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      websites: 1,
      chatbots: 1,
      conversations: 100,
      features: ['Basic analytics', 'Email support']
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      websites: 5,
      chatbots: 5,
      conversations: 1000,
      features: ['Advanced analytics', 'Priority support', 'Custom branding'],
      popular: true
    },
    {
      id: 'professional', 
      name: 'Professional',
      price: 49,
      websites: 25,
      chatbots: 25,
      conversations: 5000,
      features: ['Premium analytics', 'API access', 'Custom integrations']
    },
    {
      id: 'enterprise',
      name: 'Enterprise', 
      price: 99,
      websites: -1,
      chatbots: -1,
      conversations: 25000,
      features: ['Enterprise analytics', 'Full API access', 'Dedicated support', 'SLA guarantee']
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${plan.id === currentPlanId ? 'bg-blue-50' : ''}`}>
          {plan.popular && (
            <div className="absolute transform -translate-x-1/2 -top-3 left-1/2">
              <Badge className="text-white bg-blue-500">Most Popular</Badge>
            </div>
          )}
          
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <div className="text-2xl font-bold">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Websites</span>
                <span className="font-medium">{plan.websites === -1 ? 'Unlimited' : plan.websites}</span>
              </div>
              <div className="flex justify-between">
                <span>Chatbots</span> 
                <span className="font-medium">{plan.chatbots === -1 ? 'Unlimited' : plan.chatbots}</span>
              </div>
              <div className="flex justify-between">
                <span>Conversations</span>
                <span className="font-medium">{plan.conversations.toLocaleString()}/mo</span>
              </div>
            </div>

            <div className="space-y-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">• {feature}</div>
              ))}
            </div>

            <Button 
              className="w-full" 
              onClick={() => onUpgrade(plan.id)}
              disabled={plan.id === currentPlanId}
              variant={plan.id === currentPlanId ? "outline" : plan.popular ? "default" : "outline"}
            >
              {plan.id === currentPlanId ? 'Current Plan' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Trial Status Banner
export function TrialStatusBanner() {
  const { isTrialActive, getTrialDaysRemaining, subscription } = useSubscription()
  
  if (!isTrialActive()) return null

  const daysLeft = getTrialDaysRemaining()
  const isExpiringSoon = daysLeft <= 3

  return (
    <Alert className={`${isExpiringSoon ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
      <Clock className={`w-4 h-4 ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'}`} />
      <AlertDescription className={isExpiringSoon ? 'text-red-800' : 'text-blue-800'}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">
              {isExpiringSoon ? 'Trial expiring soon!' : 'Free trial active'}
            </span>
            <br />
            <span className="text-sm">
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in your free trial
            </span>
          </div>
          <Link href="/dashboard/settings?tab=billing">
            <Button size="sm" variant={isExpiringSoon ? "destructive" : "default"}>
              <Zap className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Quick Usage Overview Component
export function QuickUsageOverview() {
  const { subscription, getUsagePercentage } = useSubscription()
  
  if (!subscription) return null

  const metrics = [
    {
      label: 'Websites',
      used: subscription.websites_used,
      limit: subscription.websites_limit,
      percentage: getUsagePercentage('websites'),
      icon: <Globe className="w-4 h-4 text-green-600" />
    },
    {
      label: 'Chatbots', 
      used: subscription.chatbots_used,
      limit: subscription.chatbots_limit,
      percentage: getUsagePercentage('chatbots'),
      icon: <Bot className="w-4 h-4 text-purple-600" />
    },
    {
      label: 'Conversations',
      used: subscription.monthly_conversations_used,
      limit: subscription.monthly_conversations_limit, 
      percentage: getUsagePercentage('conversations'),
      icon: <MessageSquare className="w-4 h-4 text-blue-600" />
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Usage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="font-medium">{metric.label}</span>
              </div>
              <span className="text-muted-foreground">
                {metric.used} / {metric.limit === -1 ? '∞' : metric.limit}
              </span>
            </div>
            {metric.limit !== -1 && (
              <Progress 
                value={metric.percentage} 
                className={`h-2 ${
                  metric.percentage >= 100 ? '[&>div]:bg-red-500' : 
                  metric.percentage >= 80 ? '[&>div]:bg-yellow-500' : 
                  '[&>div]:bg-green-500'
                }`}
              />
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Link href="/dashboard/settings?tab=billing">
            <Button variant="outline" size="sm" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Subscription Status Component
export function SubscriptionStatus() {
  const { 
    subscription, 
    loading, 
    getCurrentPlan, 
    isTrialActive, 
    getTrialDaysRemaining,
    isPaidPlan
  } = useSubscription()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2 animate-pulse">
            <div className="w-3/4 h-4 bg-gray-200 rounded" />
            <div className="w-1/2 h-3 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium">No Subscription</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Get started with a free trial
          </p>
          <Link href="/dashboard/websites/new">
            <Button size="sm">Start Free Trial</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{getCurrentPlan()}</h3>
            <p className="text-sm text-muted-foreground">
              {isTrialActive() 
                ? `Trial • ${getTrialDaysRemaining()} days left`
                : isPaidPlan() 
                  ? 'Active subscription'
                  : 'Free plan'
              }
            </p>
          </div>
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {subscription.status}
          </Badge>
        </div>
        
        <Link href="/dashboard/settings?tab=billing">
          <Button variant="outline" size="sm" className="w-full">
            {isTrialActive() ? 'Upgrade Trial' : 'Manage Plan'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}