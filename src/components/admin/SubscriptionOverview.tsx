// src/components/admin/SubscriptionOverview.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Crown,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
// import { format } from 'date-fns'
import { format } from 'util'

interface SubscriptionMetrics {
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  cancelledSubscriptions: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  churnRate: number
  trialConversionRate: number
}

interface SubscriptionData {
  id: string
  user_id: string
  plan_id: string
  plan_name: string
  status: string
  trial_start: string | null
  trial_end: string | null
  created_at: string
  monthly_conversations_used: number
  monthly_conversations_limit: number
  websites_used: number
  websites_limit: number
  profiles: {
    full_name: string
    email: string
  }
}

export function SubscriptionOverview() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch subscription metrics
      const { data: metricsData } = await supabase.rpc('get_subscription_metrics')
      setMetrics(metricsData)

      // Fetch subscriptions with user data
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(name),
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })

      setSubscriptions(subscriptionsData || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm === '' || 
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesPlan = planFilter === 'all' || sub.plan_id === planFilter

    return matchesSearch && matchesStatus && matchesPlan
  })

  const handleExtendTrial = async (subscriptionId: string, days: number) => {
    try {
      const supabase = createClient()
      const subscription = subscriptions.find(s => s.id === subscriptionId)
      
      if (!subscription) return

      const newTrialEnd = new Date(subscription.trial_end || Date.now())
      newTrialEnd.setDate(newTrialEnd.getDate() + days)

      await supabase
        .from('subscriptions')
        .update({ trial_end: newTrialEnd.toISOString() })
        .eq('id', subscriptionId)

      fetchData()
    } catch (error) {
      console.error('Error extending trial:', error)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const supabase = createClient()
      
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      fetchData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
    }
  }

  const exportData = () => {
    const csvData = filteredSubscriptions.map(sub => ({
      Email: sub.profiles?.email,
      Name: sub.profiles?.full_name,
      Plan: sub.plan_name,
      Status: sub.status,
      'Trial End': sub.trial_end ? format(new Date(sub.trial_end), 'yyyy-MM-dd') : '',
      'Conversations Used': sub.monthly_conversations_used,
      'Websites Used': sub.websites_used,
      'Created At': format(new Date(sub.created_at), 'yyyy-MM-dd')
    }))

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return <div className="space-y-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                <p className="text-3xl font-bold">{metrics?.totalSubscriptions || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-3xl font-bold">{metrics?.activeSubscriptions || 0}</p>
              </div>
              <Crown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-3xl font-bold">${(metrics?.monthlyRecurringRevenue || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trial Conversion</p>
                <p className="text-3xl font-bold">{(metrics?.trialConversionRate || 0).toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Trial End</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{subscription.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          subscription.status === 'active' ? 'default' :
                          subscription.status === 'trialing' ? 'secondary' :
                          subscription.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Conversations: {subscription.monthly_conversations_used}/{subscription.monthly_conversations_limit}</div>
                        <div>Websites: {subscription.websites_used}/{subscription.websites_limit === -1 ? '∞' : subscription.websites_limit}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.trial_end ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">
                            {format(new Date(subscription.trial_end), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subscription.status === 'trialing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExtendTrial(subscription.id, 7)}
                          >
                            Extend Trial
                          </Button>
                        )}
                        {subscription.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelSubscription(subscription.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No subscriptions found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// src/components/admin/RevenueAnalytics.tsx
export function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      const supabase = createClient()
      
      // Get monthly revenue for the last 12 months
      const { data } = await supabase.rpc('get_monthly_revenue')
      setRevenueData(data || [])
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading revenue analytics...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revenue chart would go here */}
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-muted-foreground">Revenue chart placeholder</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                ${(revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {revenueData.length > 1 ? 
                  (((revenueData[revenueData.length - 1]?.revenue || 0) - (revenueData[revenueData.length - 2]?.revenue || 0)) / (revenueData[revenueData.length - 2]?.revenue || 1) * 100).toFixed(1) 
                  : 0
                }%
              </p>
              <p className="text-sm text-muted-foreground">Month over Month Growth</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// src/components/admin/UsageAnalytics.tsx
export function UsageAnalytics() {
  const [usageData, setUsageData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const supabase = createClient()
      
      const { data } = await supabase
        .from('usage_analytics')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })

      setUsageData(data || [])
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalConversations = usageData
    .filter(item => item.metric_type === 'conversation')
    .reduce((sum, item) => sum + item.metric_value, 0)

  const totalApiCalls = usageData
    .filter(item => item.metric_type === 'api_call')
    .reduce((sum, item) => sum + item.metric_value, 0)

  if (loading) {
    return <div>Loading usage analytics...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Analytics (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalConversations.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Conversations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalApiCalls.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">API Calls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{(totalConversations / 30).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Avg Daily Conversations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{(totalApiCalls / 30).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Avg Daily API Calls</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// src/app/admin/subscriptions/page.tsx
export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage user subscriptions, revenue, and usage analytics.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionOverview />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueAnalytics />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}