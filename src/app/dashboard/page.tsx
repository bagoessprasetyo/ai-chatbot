// src/app/dashboard/page.tsx - UPDATED WITH PROPER LIMIT CHECKING
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
  Zap,
  AlertTriangle,
  Crown,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UsageDisplay, UpgradePrompt } from "@/components/UsageDisplay";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner"; // Add this for notifications

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
  warning?: boolean;
  limitReached?: boolean;
}

const StatCard = ({ title, value, description, icon, trend, loading = false, warning = false, limitReached = false }: StatCardProps) => {
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
    <Card className={`${limitReached ? 'border-red-200 bg-red-50' : warning ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {limitReached && <Lock className="w-4 h-4 text-red-500" />}
              {warning && <AlertTriangle className="w-4 h-4 text-orange-500" />}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
              {trend && (
                <Badge variant={trend.positive ? "default" : "secondary"} className="text-xs">
                  {trend.positive ? "+" : ""}{trend.value}
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {limitReached && (
              <p className="text-xs font-medium text-red-600">Limit reached - upgrade to continue</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${
            limitReached ? "text-red-600 bg-red-100" : 
            warning ? "text-orange-600 bg-orange-100" : 
            "text-blue-600 bg-blue-100"
          }`}>
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
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

const QuickAction = ({ title, description, icon, href, disabled = false, disabledReason, onClick }: QuickActionProps) => {
  const content = (
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${disabled ? "text-gray-400 bg-gray-100" : "text-blue-600 bg-blue-100"}`}>
          {disabled ? <Lock className="w-5 h-5" /> : icon}
        </div>
        <div className="space-y-1">
          <h3 className={`font-medium ${disabled ? "text-gray-500" : ""}`}>{title}</h3>
          <p className="text-sm text-muted-foreground">
            {disabled ? disabledReason : description}
          </p>
        </div>
      </div>
    </CardContent>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-not-allowed opacity-60">
              {content}
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="transition-shadow cursor-pointer hover:shadow-md" onClick={onClick}>
      {href ? (
        <Link href={href}>
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    subscription, 
    loading: subscriptionLoading, 
    canCreateWebsite, 
    canCreateChatbot,
    getUsagePercentage,
    isTrialActive,
    getTrialDaysRemaining,
    shouldShowUpgradePrompt,
    refreshSubscription
  } = useSubscription();

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
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id);

        // Fetch chatbots count
        const { data: chatbotsData } = await supabase
          .from('chatbots')
          .select('id')
          .in('website_id', 
            (await supabase
              .from('websites')
              .select('id')
              .eq('user_id', user?.id)
            ).data?.map(w => w.id) || []
          );

        // Fetch conversations count (this month)
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .in('chatbot_id', chatbotsData?.map(c => c.id) || [])
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        setStats({
          websites: websitesCount || 0,
          chatbots: chatbotsData?.length || 0,
          conversations: conversationsCount || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
        toast.error("Failed to load dashboard stats");
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Refresh subscription data when component mounts
  useEffect(() => {
    if (user && !subscriptionLoading) {
      refreshSubscription();
    }
  }, [user]);

  // Calculate warning states based on usage
  const websiteUsage = getUsagePercentage('websites');
  const chatbotUsage = getUsagePercentage('chatbots');
  const conversationUsage = getUsagePercentage('conversations');

  const handleCreateWebsite = () => {
    if (!canCreateWebsite()) {
      toast.error("Website limit reached", {
        description: "Upgrade your plan to create more websites",
        action: {
          label: "Upgrade",
          onClick: () => window.location.href = "/dashboard/settings/billing"
        }
      });
      return;
    }
    window.location.href = "/dashboard/websites/new";
  };

  const handleCreateChatbot = () => {
    if (!canCreateChatbot()) {
      toast.error("Chatbot limit reached", {
        description: "Upgrade your plan to create more chatbots",
        action: {
          label: "Upgrade", 
          onClick: () => window.location.href = "/dashboard/settings/billing"
        }
      });
      return;
    }
    window.location.href = "/dashboard/chatbots";
  };

  const statCards = [
    {
      title: "Active Websites",
      value: stats.websites.toString(),
      description: subscription ? 
        `${subscription.websites_remaining} remaining` : 
        "Loading...",
      icon: <Globe className="w-5 h-5" />,
      warning: websiteUsage >= 80 && websiteUsage < 100,
      limitReached: !canCreateWebsite() && stats.websites > 0,
    },
    {
      title: "Chatbots",
      value: stats.chatbots.toString(),
      description: subscription ? 
        `${subscription.chatbots_remaining} remaining` : 
        "Loading...",
      icon: <Bot className="w-5 h-5" />,
      warning: chatbotUsage >= 80 && chatbotUsage < 100,
      limitReached: !canCreateChatbot() && stats.chatbots > 0,
    },
    {
      title: "Conversations",
      value: stats.conversations.toString(),
      description: subscription ? 
        `${subscription.conversations_remaining} remaining this month` : 
        "This month",
      icon: <MessageSquare className="w-5 h-5" />,
      warning: conversationUsage >= 80 && conversationUsage < 100,
      limitReached: conversationUsage >= 100,
    },
    {
      title: "Response Rate",
      value: "98.5%",
      description: "Average accuracy",
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const quickActions = [
    {
      title: "Add New Website",
      description: "Connect a new website and create a chatbot",
      icon: <Plus className="w-5 h-5" />,
      href: "",
      disabled: !canCreateWebsite(),
      disabledReason: "Website limit reached - upgrade to add more",
      onClick: handleCreateWebsite
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
      href: "",
      disabled: !canCreateChatbot(),
      disabledReason: "Chatbot limit reached - upgrade to create more",
      onClick: handleCreateChatbot
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Here's what's happening with your chatbots today.
            </p>
            {subscription && (
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.plan_name}
                {isTrialActive() && ` (${getTrialDaysRemaining()} days left)`}
              </Badge>
            )}
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={handleCreateWebsite}
                  disabled={!canCreateWebsite()}
                  variant={canCreateWebsite() ? "default" : "outline"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Website
                  {!canCreateWebsite() && <Lock className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </TooltipTrigger>
            {!canCreateWebsite() && (
              <TooltipContent>
                <p>Website limit reached. Upgrade to add more websites.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Limit Reached Alert */}
      {(!canCreateWebsite() || !canCreateChatbot()) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>
                You've reached your {!canCreateWebsite() ? 'website' : 'chatbot'} limit. 
                Upgrade your plan to continue growing.
              </span>
              <Link href="/dashboard/settings/billing">
                <Button size="sm" variant="destructive">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Warning */}
      {isTrialActive() && getTrialDaysRemaining() <= 3 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Crown className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your free trial expires in {getTrialDaysRemaining()} days. 
            <Link href="/dashboard/settings/billing" className="ml-1 font-medium underline">
              Upgrade now
            </Link> to continue using your chatbots.
          </AlertDescription>
        </Alert>
      )}

      {/* Upgrade Prompt */}
      {shouldShowUpgradePrompt() && !isTrialActive() && (
        <UpgradePrompt />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} loading={stats.loading || subscriptionLoading} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
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
                    <Button onClick={handleCreateWebsite} disabled={!canCreateWebsite()}>
                      Add Website
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage Display */}
          <UsageDisplay />

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
                  <div className={`p-1 rounded-full ${stats.websites > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                    <div className={`w-2 h-2 rounded-full ${stats.websites > 0 ? "bg-green-600" : "bg-gray-400"}`} />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Add your first website</p>
                    <p className="text-muted-foreground">
                      {stats.websites > 0 ? `${stats.websites} websites added` : "Connect a website to get started"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${stats.chatbots > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                    <div className={`w-2 h-2 rounded-full ${stats.chatbots > 0 ? "bg-green-600" : "bg-gray-400"}`} />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Deploy chatbot</p>
                    <p className="text-muted-foreground">
                      {stats.chatbots > 0 ? `${stats.chatbots} chatbots deployed` : "Add the widget to your site"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter>
              <Button 
                onClick={handleCreateWebsite} 
                className="w-full" 
                disabled={!canCreateWebsite()}
                variant={canCreateWebsite() ? "default" : "outline"}
              >
                {canCreateWebsite() ? "Get Started" : "Upgrade to Continue"}
                {!canCreateWebsite() && <Lock className="w-4 h-4 ml-2" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}