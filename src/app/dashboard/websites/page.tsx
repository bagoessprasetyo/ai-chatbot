// src/app/dashboard/websites/page.tsx
'use client'

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Plus,
  MoreVertical,
  Trash2,
  ExternalLink,
  Settings,
  Bot,
  RefreshCw,
  Info
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/lib/supabase";
import { scrapingService } from "@/lib/scraping-service";

type Website = Database['public']['Tables']['websites']['Row'];

const WebsitesPage = () => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWebsites(data || []);
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWebsites();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      scraping: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      ready: "bg-green-100 text-green-800 hover:bg-green-200",
      error: "bg-red-100 text-red-800 hover:bg-red-200"
    };

    return (
      <Badge className={cn(variants[status as keyof typeof variants] || variants.pending)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWebsites(websites.filter(website => website.id !== id));
    } catch (error) {
      console.error('Error deleting website:', error);
    }
  };

  const handleRescrapeWebsite = async (website: Website) => {
    try {
      const result = await scrapingService.retryScraping(website.id, website.url);
      
      if (result.success) {
        // Update local state to show scraping status
        setWebsites(websites.map(w => 
          w.id === website.id ? { ...w, status: 'scraping' } : w
        ));
      } else {
        console.error('Re-scraping failed:', result.error);
      }
    } catch (error) {
      console.error('Error re-scraping website:', error);
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
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">
            Manage your websites and their chatbots
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/websites/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Link>
        </Button>
      </div>

      {/* Empty State */}
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
        /* Websites Table */
        <Card>
          <CardHeader>
            <CardTitle>Your Websites</CardTitle>
            <CardDescription>
              {websites.length} website{websites.length !== 1 ? 's' : ''} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 text-blue-600 bg-blue-100 rounded-full">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            <Link 
                              href={`/dashboard/websites/${website.id}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {website.title || 'Untitled Website'}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ExternalLink className="w-3 h-3" />
                            <a 
                              href={website.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                            >
                              {website.url}
                            </a>
                          </div>
                          {website.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {website.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(website.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(website.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/websites/${website.id}`}>
                              <Info className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/websites/${website.id}/manage-chatbot`}>
                              <Bot className="w-4 h-4 mr-2" />
                              Manage Chatbot
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/websites/${website.id}/settings`}>
                              <Settings className="w-4 h-4 mr-2" />
                              Website Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRescrapeWebsite(website)}
                            disabled={website.status === 'scraping'}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-scrape Content
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWebsite(website.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Website
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {websites.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
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
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready Chatbots</p>
                  <p className="text-2xl font-bold">
                    {websites.filter(w => w.status === 'ready').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">
                    {websites.filter(w => ['pending', 'scraping'].includes(w.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WebsitesPage;