// src/app/dashboard/page.tsx
'use client'

import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpRight, 
  Bot, 
  Globe, 
  MessageSquare, 
  Plus, 
  TrendingUp,
//   Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  loading?: boolean;
}

const StatCard = ({ title, value, description, icon, trend, loading = false }: StatCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-24 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
              {trend && (
                <Badge variant={trend.positive ? "default" : "secondary"} className="text-xs">
                  {trend.positive ? "+" : ""}{trend.value}
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="p-3 text-blue-600 bg-blue-100 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const QuickAction = ({ title, description, icon, href }: QuickActionProps) => {
  return (
    <Card className="transition-shadow cursor-pointer hover:shadow-md">
      <Link href={href}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 text-blue-600 bg-blue-100 rounded-full">
              {icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    websites: 0,
    chatbots: 0,
    conversations: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();
        
        // Fetch websites count
        const { count: websitesCount } = await supabase
          .from('websites')
          .select('*', { count: 'exact', head: true });

        // Fetch chatbots count
        const { count: chatbotsCount } = await supabase
          .from('chatbots')
          .select('*', { count: 'exact', head: true });

        // Fetch conversations count (this month)
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });

        setStats({
          websites: websitesCount || 0,
          chatbots: chatbotsCount || 0,
          conversations: conversationsCount || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const statCards = [
    {
      title: "Active Websites",
      value: stats.websites.toString(),
      description: "Websites with chatbots",
      icon: <Globe className="w-5 h-5" />,
      trend: { value: "2 new", positive: true },
    },
    {
      title: "Chatbots",
      value: stats.chatbots.toString(),
      description: "Total deployed bots",
      icon: <Bot className="w-5 h-5" />,
      trend: { value: "1 new", positive: true },
    },
    {
      title: "Conversations",
      value: stats.conversations.toString(),
      description: "This month",
      icon: <MessageSquare className="w-5 h-5" />,
      trend: { value: "12%", positive: true },
    },
    {
      title: "Response Rate",
      value: "98.5%",
      description: "Average accuracy",
      icon: <TrendingUp className="w-5 h-5" />,
      trend: { value: "0.5%", positive: true },
    },
  ];

  const quickActions = [
    {
      title: "Add New Website",
      description: "Connect a new website and create a chatbot",
      icon: <Plus className="w-5 h-5" />,
      href: "/dashboard/websites/new"
    },
    {
      title: "View Analytics",
      description: "Check chatbot performance and conversations",
      icon: <TrendingUp className="w-5 h-5" />,
      href: "/dashboard/analytics"
    },
    {
      title: "Manage Chatbots",
      description: "Configure and customize your chatbots",
      icon: <Bot className="w-5 h-5" />,
      href: "/dashboard/chatbots"
    },
    {
      title: "Upgrade Plan",
      description: "Get more features and higher limits",
      icon: <Zap className="w-5 h-5" />,
      href: "/dashboard/settings/billing"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.user_metadata?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here is whats happening with your chatbots today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/websites/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} loading={stats.loading} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get started with these common tasks
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">Account created</p>
                  <p className="text-muted-foreground">Welcome to WebBot AI!</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-1 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">Add your first website</p>
                  <p className="text-muted-foreground">Connect a website to get started</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-1 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">Deploy chatbot</p>
                  <p className="text-muted-foreground">Add the widget to your site</p>
                </div>
              </div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/websites/new">
                Get Started
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            View all
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.loading ? (
              // Loading skeleton
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="w-48 h-4" />
                    <Skeleton className="w-32 h-3" />
                  </div>
                </div>
              ))
            ) : stats.websites === 0 ? (
              // Empty state
              <div className="py-8 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium">No activity yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Start by adding your first website to see activity here.
                </p>
                <Button asChild>
                  <Link href="/dashboard/websites/new">
                    Add Website
                  </Link>
                </Button>
              </div>
            ) : (
              // Sample activities - this would come from real data
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 text-green-600 bg-green-100 rounded-full">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chatbot activated</p>
                    <p className="text-xs text-muted-foreground">Your website chatbot is now live</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}