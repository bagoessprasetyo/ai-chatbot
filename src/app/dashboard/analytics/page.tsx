// src/app/dashboard/analytics/page.tsx
'use client'

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  MessageSquare, 
//   Users, 
  Clock, 
  BarChart3,
  Download,
//   Calendar,
  Bot,
  Globe,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

interface AnalyticsData {
  totalConversations: number
  totalWebsites: number
  totalChatbots: number
  avgResponseTime: number
  satisfactionRate: number
  conversationTrends: Array<{
    date: string
    conversations: number
    unique_visitors: number
  }>
  topWebsites: Array<{
    id: string
    title: string
    conversations: number
    satisfaction: number
  }>
  responseTimeData: Array<{
    hour: string
    avg_time: number
  }>
  satisfactionData: Array<{
    rating: string
    count: number
  }>
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: {
  title: string
  value: string | number
  change: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{value}</p>
              <Badge variant="secondary" className={trendColors[trend]}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {change}
              </Badge>
            </div>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalConversations: 0,
    totalWebsites: 0,
    totalChatbots: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    conversationTrends: [],
    topWebsites: [],
    responseTimeData: [],
    satisfactionData: []
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Fetch basic counts
        const [
          { count: websitesCount },
          { count: chatbotsCount },
          { count: conversationsCount }
        ] = await Promise.all([
          supabase.from('websites').select('*', { count: 'exact', head: true }),
          supabase.from('chatbots').select('*', { count: 'exact', head: true }),
          supabase.from('conversations').select('*', { count: 'exact', head: true })
        ])

        // Fetch websites with conversation counts
        const { data: websites } = await supabase
          .from('websites')
          .select(`
            id,
            title,
            chatbots (
              id,
              conversations (id)
            )
          `)

        // Generate mock data for demonstration
        const mockConversationTrends = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          conversations: Math.floor(Math.random() * 50) + 10,
          unique_visitors: Math.floor(Math.random() * 30) + 5
        }))

        const mockResponseTimeData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          avg_time: Math.random() * 3 + 0.5
        }))

        const mockSatisfactionData = [
          { rating: 'Excellent', count: 45 },
          { rating: 'Good', count: 32 },
          { rating: 'Average', count: 15 },
          { rating: 'Poor', count: 8 }
        ]

        setAnalyticsData({
          totalConversations: conversationsCount || 0,
          totalWebsites: websitesCount || 0,
          totalChatbots: chatbotsCount || 0,
          avgResponseTime: 1.2,
          satisfactionRate: 87,
          conversationTrends: mockConversationTrends,
          topWebsites: websites?.map(w => ({
            id: w.id,
            title: w.title || 'Untitled',
            conversations: w.chatbots?.reduce((sum, c) => sum + (c.conversations?.length || 0), 0) || 0,
            satisfaction: Math.floor(Math.random() * 20) + 80
          })).slice(0, 5) || [],
          responseTimeData: mockResponseTimeData,
          satisfactionData: mockSatisfactionData
        })

      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, timeRange])

  const exportData = () => {
    const exportData = {
      ...analyticsData,
      exportedAt: new Date().toISOString(),
      timeRange
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your chatbot performance and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Conversations"
          value={analyticsData.totalConversations.toLocaleString()}
          change="+12%"
          icon={MessageSquare}
          trend="up"
        />
        <MetricCard
          title="Active Websites"
          value={analyticsData.totalWebsites}
          change="+5%"
          icon={Globe}
          trend="up"
        />
        <MetricCard
          title="Active Chatbots"
          value={analyticsData.totalChatbots}
          change="0%"
          icon={Bot}
          trend="neutral"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analyticsData.avgResponseTime}s`}
          change="-8%"
          icon={Clock}
          trend="up"
        />
        <MetricCard
          title="Satisfaction Rate"
          value={`${analyticsData.satisfactionRate}%`}
          change="+3%"
          icon={Target}
          trend="up"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="websites">
            <BarChart3 className="w-4 h-4 mr-2" />
            Websites
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Conversation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
                <CardDescription>
                  Daily conversation volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.conversationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Conversations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="unique_visitors" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Unique Visitors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction</CardTitle>
                <CardDescription>
                  Distribution of user feedback ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.satisfactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rating, percent }) => `${rating} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Websites */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Websites</CardTitle>
              <CardDescription>
                Websites ranked by conversation volume and satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topWebsites.map((website, index) => (
                  <div key={website.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{website.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {website.conversations} conversations
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{website.satisfaction}% satisfaction</p>
                      <div className="w-16 h-2 mt-1 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${website.satisfaction}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {analyticsData.topWebsites.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No data available yet. Add websites and chatbots to see analytics.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Volume</CardTitle>
              <CardDescription>
                Daily conversation statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.conversationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversations" fill="#3b82f6" name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Time by Hour</CardTitle>
              <CardDescription>
                Average response time throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avg_time" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Avg Response Time (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Websites Tab */}
        <TabsContent value="websites" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analyticsData.topWebsites.map((website) => (
              <Card key={website.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{website.title}</CardTitle>
                  <CardDescription>Website Analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversations</span>
                      <span className="font-medium">{website.conversations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Satisfaction</span>
                      <span className="font-medium">{website.satisfaction}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(website.conversations / Math.max(...analyticsData.topWebsites.map(w => w.conversations))) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}