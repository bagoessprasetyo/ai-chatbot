// src/app/dashboard/settings/billing/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, 
  Check, 
  Zap, 
  Globe, 
  Bot, 
  MessageSquare, 
  CreditCard,
  Download,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { createClient } from '@/lib/supabase'

interface PricingCardProps {
  plan: {
    id: string
    name: string
    price: number
    features: string[]
    limits: {
      websites: number
      chatbots: number
      monthlyConversations: number
    }
    is_popular: boolean
  }
  currentPlan?: boolean
  onUpgrade: (planId: string) => void
  loading: boolean
}

const PricingCard = ({ plan, currentPlan = false, onUpgrade, loading }: PricingCardProps) => {
  return (
    <Card className={`relative ${plan.is_popular ? 'border-blue-500 shadow-lg' : ''} ${currentPlan ? 'bg-blue-50 border-blue-200' : ''}`}>
      {plan.is_popular && (
        <div className="absolute transform -translate-x-1/2 -top-3 left-1/2">
          <Badge className="text-white bg-blue-500">Most Popular</Badge>
        </div>
      )}
      {currentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="text-green-700 bg-green-100 border-green-500">
            Current Plan
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">${(plan.price / 100).toFixed(0)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Websites
            </span>
            <span className="font-medium">
              {plan.limits.websites === -1 ? 'Unlimited' : plan.limits.websites}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Chatbots
            </span>
            <span className="font-medium">
              {plan.limits.chatbots === -1 ? 'Unlimited' : plan.limits.chatbots}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversations
            </span>
            <span className="font-medium">
              {plan.limits.monthlyConversations.toLocaleString()}/month
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="flex-shrink-0 w-4 h-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onUpgrade(plan.id)}
          disabled={currentPlan || loading}
          variant={currentPlan ? "outline" : plan.is_popular ? "default" : "outline"}
        >
          {currentPlan ? 'Current Plan' : 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  )
}

interface UsageMetricProps {
  label: string
  used: number
  limit: number
  icon: React.ReactNode
  formatValue?: (value: number) => string
}

const UsageMetric = ({ label, used, limit, icon, formatValue = (v) => v.toString() }: UsageMetricProps) => {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100)
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
            {formatValue(used)} / {isUnlimited ? 'Unlimited' : formatValue(limit)}
          </span>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="secondary" className="text-xs">Near Limit</Badge>
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

export default function BillingSettingsPage() {
  const {
    subscription,
    loading,
    getCurrentPlan,
    isTrialActive,
    getTrialDaysRemaining,
    refreshSubscription
  } = useSubscription()

  const [plans, setPlans] = useState<any[]>([])
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchBillingHistory()
  }, [])

  const fetchPlans = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchBillingHistory = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setBillingHistory(data || [])
    } catch (error) {
      console.error('Error fetching billing history:', error)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgradeLoading(true)
    try {
      // In a real app, this would integrate with Stripe
      // For now, we'll just show a message
      alert(`Upgrade to ${plans.find(p => p.id === planId)?.name} plan would be processed here with Stripe integration.`)
    } catch (error) {
      console.error('Error upgrading plan:', error)
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    try {
      // In a real app, this would update via Stripe webhook
      alert('Subscription cancellation would be processed here.')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing information
          </p>
        </div>
        {subscription && (
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {getCurrentPlan()}
            {isTrialActive() && ` (${getTrialDaysRemaining()} days left)`}
          </Badge>
        )}
      </div>

      {/* Trial Alert */}
      {isTrialActive() && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Trial expires in {getTrialDaysRemaining()} days</strong>
            <br />
            Upgrade to a paid plan to continue using your chatbots without interruption.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="usage">Current Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Current Plan Overview */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{subscription.plan_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription.status === 'trialing' ? 'Free Trial' : `$${(plans.find(p => p.id === subscription.plan_id)?.price / 100 || 0)}/month`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {subscription.status === 'trialing' ? 'Trial' : 'Active'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.status === 'trialing' 
                        ? `Ends ${subscription.trial_end ? new Date(subscription.trial_end).toLocaleDateString() : 'N/A'}`
                        : subscription.current_period_end
                          ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                          : 'Active subscription'
                      }
                    </p>    
                  </div>
                </div>

                {subscription.status === 'active' && subscription.cancel_at_period_end && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Your subscription is set to cancel at the end of the current billing period.
                    </AlertDescription>
                  </Alert>
                )}

                {subscription.status === 'active' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelSubscription}>
                      Cancel Subscription
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Payment Method
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pricing Plans */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">Choose Your Plan</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={subscription?.plan_id === plan.id}
                  onUpgrade={handleUpgrade}
                  loading={upgradeLoading}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Current Usage
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your usage against plan limits
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription && (
                <>
                  <UsageMetric
                    label="Websites"
                    used={subscription.websites_used}
                    limit={subscription.websites_limit}
                    icon={<Globe className="w-4 h-4 text-green-600" />}
                  />
                  
                  <UsageMetric
                    label="Chatbots"
                    used={subscription.chatbots_used}
                    limit={subscription.chatbots_limit}
                    icon={<Bot className="w-4 h-4 text-purple-600" />}
                  />
                  
                  <UsageMetric
                    label="Conversations"
                    used={subscription.monthly_conversations_used}
                    limit={subscription.monthly_conversations_limit}
                    icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
                    formatValue={(v) => v.toLocaleString()}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing History
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and download your past invoices
              </p>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium">No billing history</h3>
                  <p className="text-sm text-muted-foreground">
                    Your billing history will appear here once you have a paid subscription.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          Invoice #{invoice.stripe_invoice_id?.slice(-8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString()} • ${(invoice.amount_paid / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                        {invoice.invoice_pdf_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={invoice.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}