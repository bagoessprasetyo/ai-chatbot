// src/components/subscription/UsageDisplay.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Globe, Bot, MessageSquare, Zap, Crown, Clock } from 'lucide-react'
import Link from 'next/link'

interface UsageItemProps {
  label: string
  used: number
  limit: number
  icon: React.ReactNode
  type: 'conversations' | 'websites' | 'chatbots'
}

function UsageItem({ label, used, limit, icon, type }: UsageItemProps) {
  const { getUsagePercentage } = useSubscription()
  const percentage = getUsagePercentage(type)
  const isUnlimited = limit === -1
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isUnlimited ? `${used.toLocaleString()} / Unlimited` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
          </span>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="secondary" className="text-xs">
              Near Limit
            </Badge>
          )}
        </div>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={`h-2 ${
            isAtLimit ? '[&>div]:bg-red-500' : 
            isNearLimit ? '[&>div]:bg-yellow-500' : 
            '[&>div]:bg-green-500'
          }`}
        />
      )}
    </div>
  )
}

export function UsageDisplay() {
  const { 
    subscription, 
    loading, 
    getCurrentPlan, 
    isTrialActive, 
    getTrialDaysRemaining,
    shouldShowUpgradePrompt 
  } = useSubscription()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2 font-medium">No Subscription</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start your free trial by creating your first website
          </p>
          <Button asChild>
            <Link href="/dashboard/websites/new">
              Get Started
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const trialDays = getTrialDaysRemaining()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Usage & Limits</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
              {getCurrentPlan()}
            </Badge>
            {isTrialActive() && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {trialDays} days left
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageItem
          label="Conversations"
          used={subscription.monthly_conversations_used}
          limit={subscription.monthly_conversations_limit}
          icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
          type="conversations"
        />
        
        <UsageItem
          label="Websites"
          used={subscription.websites_used}
          limit={subscription.websites_limit}
          icon={<Globe className="w-4 h-4 text-green-600" />}
          type="websites"
        />
        
        <UsageItem
          label="Chatbots"
          used={subscription.chatbots_used}
          limit={subscription.chatbots_limit}
          icon={<Bot className="w-4 h-4 text-purple-600" />}
          type="chatbots"
        />

        {shouldShowUpgradePrompt() && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {isTrialActive() ? 'Upgrade before trial ends' : 'Upgrade for more resources'}
                  </p>
                  <p className="text-xs text-blue-700">
                    Get unlimited websites, more conversations, and advanced features
                  </p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/settings/billing">
                  Upgrade
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// src/components/subscription/UpgradePrompt.tsx
interface UpgradePromptProps {
  trigger?: 'website' | 'chatbot' | 'conversation' | 'trial'
  onClose?: () => void
}

export function UpgradePrompt({ trigger = 'website', onClose }: UpgradePromptProps) {
  const { subscription, getCurrentPlan, getTrialDaysRemaining } = useSubscription()

  const getPromptContent = () => {
    switch (trigger) {
      case 'website':
        return {
          title: 'Website Limit Reached',
          description: 'You\'ve reached your website limit. Upgrade to add more websites and grow your business.',
          icon: <Globe className="w-6 h-6 text-blue-600" />
        }
      case 'chatbot':
        return {
          title: 'Chatbot Limit Reached',
          description: 'You\'ve reached your chatbot limit. Upgrade to create more chatbots for your websites.',
          icon: <Bot className="w-6 h-6 text-purple-600" />
        }
      case 'conversation':
        return {
          title: 'Conversation Limit Reached',
          description: 'You\'ve used all your monthly conversations. Upgrade to continue engaging with visitors.',
          icon: <MessageSquare className="w-6 h-6 text-green-600" />
        }
      case 'trial':
        return {
          title: 'Trial Ending Soon',
          description: `Your free trial ends in ${getTrialDaysRemaining()} days. Upgrade to keep your chatbots running.`,
          icon: <Clock className="w-6 h-6 text-orange-600" />
        }
    }
  }

  const content = getPromptContent()

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {content.icon}
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-gray-900">{content.title}</h3>
            <p className="mb-4 text-sm text-gray-700">{content.description}</p>
            
            <div className="flex items-center gap-3">
              <Button asChild className="flex-1">
                <Link href="/dashboard/settings/billing">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Later
                </Button>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Currently on <strong>{getCurrentPlan()}</strong> plan
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// src/components/subscription/LimitGuard.tsx
interface LimitGuardProps {
  limitType: 'website' | 'chatbot' | 'conversation'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LimitGuard({ limitType, children, fallback }: LimitGuardProps) {
  const { canCreateWebsite, canCreateChatbot, canSendMessage } = useSubscription()

  const canProceed = () => {
    switch (limitType) {
      case 'website':
        return canCreateWebsite()
      case 'chatbot':
        return canCreateChatbot()
      case 'conversation':
        return canSendMessage()
      default:
        return false
    }
  }

  if (!canProceed()) {
    return fallback || <UpgradePrompt trigger={limitType} />
  }

  return <>{children}</>
}