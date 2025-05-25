import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Globe, 
  Bot, 
  MessageSquare, 
  AlertTriangle,
  Crown,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSettings'
import { PLANS, PlanFeatures } from '@/lib/types/settings'

interface UsageDisplayProps {
  showTitle?: boolean
  compact?: boolean
}

export default function SubscriptionUsageDisplay({ showTitle = true, compact = false }: UsageDisplayProps) {
  const { subscription, loading } = useSubscription()

  const currentPlan = PLANS.find(plan => plan.id === subscription?.plan_id) || PLANS[0]

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-600'
    return 'text-green-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const isTrialExpiring = () => {
    if (!subscription || subscription.status !== 'trialing' || !subscription.trial_end) return false
    const daysLeft = Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3
  }

  const getTrialDaysLeft = () => {
    if (!subscription || subscription.status !== 'trialing' || !subscription.trial_end) return 0
    return Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <Card className={compact ? "h-32" : ""}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load subscription information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  const conversationPercentage = getUsagePercentage(
    subscription.monthly_conversations_used, 
    subscription.monthly_conversations_limit
  )

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{currentPlan.name}</span>
              {subscription.status === 'trialing' && (
                <Badge variant="secondary" className="text-xs">
                  Trial
                </Badge>
              )}
            </div>
            {(conversationPercentage >= 80 || isTrialExpiring()) && (
              <Button size="sm" asChild>
                <Link href="/dashboard/settings?tab=billing">
                  <Zap className="h-3 w-3 mr-1" />
                  Upgrade
                </Link>
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Conversations</span>
              <span className={getStatusColor(conversationPercentage)}>
                {subscription.monthly_conversations_used} / {subscription.monthly_conversations_limit}
              </span>
            </div>
            <Progress 
              value={conversationPercentage} 
              className="h-2"
              style={{
                '--progress-foreground': getProgressColor(conversationPercentage)
              } as React.CSSProperties}
            />
          </div>

          {isTrialExpiring() && (
            <Alert className="mt-3 border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-xs">
                Trial expires in {getTrialDaysLeft()} days
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            Subscription Usage
          </CardTitle>
          <CardDescription>
            Current plan: {currentPlan.name}
            {subscription.status === 'trialing' && ` (${getTrialDaysLeft()} days left in trial)`}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {/* Trial Warning */}
        {isTrialExpiring() && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Your free trial expires in {getTrialDaysLeft()} days. 
              <Link href="/dashboard/settings?tab=billing" className="font-medium underline ml-1">
                Upgrade now to continue using all features.
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Conversations Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Conversations</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(conversationPercentage)}`}>
              {subscription.monthly_conversations_used} / {subscription.monthly_conversations_limit}
            </span>
          </div>
          <Progress 
            value={conversationPercentage} 
            className="h-3"
            style={{
              '--progress-foreground': getProgressColor(conversationPercentage)
            } as React.CSSProperties}
          />
          {conversationPercentage >= 100 && (
            <p className="text-sm text-red-600">
              Conversation limit reached. Upgrade to continue.
            </p>
          )}
        </div>

        {/* Websites and Chatbots Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Websites</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Limit: {subscription.websites_limit}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Chatbots</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Limit: {subscription.chatbots_limit}
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {(conversationPercentage >= 80 || currentPlan.id === 'free') && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {conversationPercentage >= 80 ? 'Running low on conversations' : 'Ready to upgrade?'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Get more conversations and features with a paid plan
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/settings?tab=billing">
                  <Zap className="h-3 w-3 mr-1" />
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