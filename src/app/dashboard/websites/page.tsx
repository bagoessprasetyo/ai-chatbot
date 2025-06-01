'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Globe, 
  Plus, 
  Bot, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
// import { WebsiteStatusCard } from "@/components/WebsiteStatusCard";
import { Database } from "@/lib/supabase";
import { WebsiteStatusCard } from "@/components/WebisteStatusCard";

type Website = Database['public']['Tables']['websites']['Row'];

const WebsitesPage = () => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueStats, setQueueStats] = useState<any>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const supabase = createClient();
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Authentication error:', authError);
          return;
        }
    
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .eq('user_id', user.id)  // Filter by current user's ID
          .order('created_at', { ascending: false });
    
        if (error) throw error;
        setWebsites(data || []);
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchQueueStats = async () => {
      try {
        const response = await fetch('/api/scraping-queue');
        if (response.ok) {
          const { stats } = await response.json();
          setQueueStats(stats);
        }
      } catch (error) {
        console.error('Error fetching queue stats:', error);
      }
    };

    if (user) {
      fetchWebsites();
      // fetchQueueStats();
      
      // Refresh queue stats every 30 seconds
      // const interval = setInterval(fetchQueueStats, 30000);
      // return () => clearInterval(interval);
    }
  }, [user]);

  const handleRetryScaping = async (websiteId: string) => {
    try {
      const response = await fetch('/api/scraping-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, priority: 'high' })
      });

      if (response.ok) {
        // Update website status locally
        setWebsites(websites.map(w => 
          w.id === websiteId ? { ...w, status: 'pending' } : w
        ));
      }
    } catch (error) {
      console.error('Error retrying scraping:', error);
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;

      setWebsites(websites.filter(website => website.id !== websiteId));
    } catch (error) {
      console.error('Error deleting website:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statusCounts = websites.reduce((acc, website) => {
    acc[website.status] = (acc[website.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">
            Manage your websites and their AI chatbots
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/websites/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Websites</p>
                <p className="text-2xl font-bold">{websites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold">{statusCounts.ready || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {(statusCounts.pending || 0) + (statusCounts.scraping || 0) + (statusCounts.processing || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{statusCounts.error || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Stats (if available) */}
      {queueStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Processing Queue
            </CardTitle>
            <CardDescription>
              Current status of the automated processing system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Pending</Badge>
                <p className="text-2xl font-bold">{queueStats.pending}</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Processing</Badge>
                <p className="text-2xl font-bold">{queueStats.processing}</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Completed</Badge>
                <p className="text-2xl font-bold">{queueStats.completed}</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Failed</Badge>
                <p className="text-2xl font-bold">{queueStats.failed}</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Total</Badge>
                <p className="text-2xl font-bold">{queueStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Websites Grid */}
      {websites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="w-16 h-16 mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No websites yet</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Add your first website to start creating AI chatbots for your visitors.
            </p>
            <Button asChild>
              <Link href="/dashboard/websites/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Website
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <WebsiteStatusCard
              key={website.id}
              website={website}
              onRetryScaping={handleRetryScaping}
              onDelete={handleDeleteWebsite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WebsitesPage;