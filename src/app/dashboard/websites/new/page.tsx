/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/websites/new/page.tsx
'use client'

import * as React from "react";
import { useState } from "react";
import { Globe, Check, AlertCircle, ArrowLeft, Loader2, Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { scrapingService } from "@/lib/scraping-service";

const isValidUrl = (url: string): boolean => {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
    new URL(urlWithProtocol);
    return true;
  } catch (e) {
    return false;
  }
};

type ScrapingStatus2 = 'idle' | 'creating' | 'pending' | 'scraping' | 'processing' | 'error' | 'ready';

interface ScrapingProgress {
  status: ScrapingStatus2
  message: string
  progress: number
}

const getProgressInfo = (status: ScrapingStatus2): ScrapingProgress => {
  switch (status) {
    case 'idle':
      return { status, message: 'Ready to start', progress: 0 }
    case 'creating':
      return { status, message: 'Creating website record...', progress: 10 }
    case 'pending':
      return { status, message: 'Preparing to scrape website...', progress: 20 }
    case 'scraping':
      return { status, message: 'Analyzing website content...', progress: 50 }
    case 'processing':
      return { status, message: 'Generating AI chatbot...', progress: 80 }
    case 'ready':
      return { status, message: 'Chatbot ready!', progress: 100 }
    case 'error':
      return { status, message: 'Something went wrong', progress: 0 }
    default:
      return { status: 'idle', message: 'Ready to start', progress: 0 }
  }
}

export default function NewWebsitePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus2>('idle');
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [chatbotId, setChatbotId] = useState<string | null>(null);

  const progressInfo = getProgressInfo(scrapingStatus);
  const isProcessing = !['idle', 'ready', 'error','ready'].includes(scrapingStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate URL
    if (!formData.url.trim()) {
      setError("Please enter a website URL");
      return;
    }
    
    // Check if URL is valid
    if (!isValidUrl(formData.url)) {
      setError("Please enter a valid website URL");
      return;
    }
    
    if (!user) {
      setError("You must be logged in to add a website");
      return;
    }
    
    setScrapingStatus('creating');
    
    try {
      const supabase = createClient();
      
      // Format URL with protocol if missing
      const formattedUrl = formData.url.match(/^https?:\/\//) ? formData.url : `https://${formData.url}`;
      
      // Check if website already exists for this user (fixed)
      const { data: existing, error: checkError } = await supabase
        .from('websites')
        .select('id')
        .eq('url', formattedUrl)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single()
      
      // Only throw error if it's not a "no rows" error
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        setError("This website is already added to your account");
        setScrapingStatus('idle');
        return;
      }
      
      // Insert new website
      const { data, error: insertError } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          url: formattedUrl,
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newWebsiteId = data.id;
      setWebsiteId(newWebsiteId);
      
      // Start scraping process
      const result = await scrapingService.scrapeWebsite({
        websiteId: newWebsiteId,
        url: formattedUrl,
        onStatusUpdate: setScrapingStatus
      });
      
      if (result.success) {
        setChatbotId(result.chatbotId || null);
        setScrapingStatus('ready');
      } else {
        setError(result.error || 'Failed to process website');
        setScrapingStatus('error');
      }
      
    } catch (error: any) {
      console.error('Error adding website:', error);
      setError(error.message || "Failed to add website. Please try again.");
      setScrapingStatus('error');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleViewChatbot = () => {
    if (websiteId) {
      router.push(`/dashboard/websites/${websiteId}/chatbot`);
    }
  };

  const handleAddAnother = () => {
    setFormData({ url: '', title: '', description: '' });
    setError(null);
    setScrapingStatus('idle');
    setWebsiteId(null);
    setChatbotId(null);
  };

  // Success state
  if (scrapingStatus === 'ready') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/websites">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Website Added Successfully!</h1>
            <p className="text-muted-foreground">
              Your AI chatbot is ready to help your visitors
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 p-3 mx-auto bg-green-100 rounded-full">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Chatbot Created Successfully!</h2>
              <p className="text-muted-foreground">
                We have analyzed your website and created an intelligent chatbot that can answer 
                questions about your content.
              </p>
              
              <div className="flex justify-center gap-3 pt-4">
                <Button onClick={handleViewChatbot}>
                  <Bot className="w-4 h-4 mr-2" />
                  Configure Chatbot
                </Button>
                <Button variant="outline" onClick={handleAddAnother}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Website
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/websites">
                    View All Websites
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild disabled={isProcessing}>
          <Link href="/dashboard/websites">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Website</h1>
          <p className="text-muted-foreground">
            Connect your website to create an AI-powered chatbot
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {/* Progress Card */}
          {isProcessing && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <h3 className="font-medium">{progressInfo.message}</h3>
                      <p className="text-sm text-muted-foreground">
                        This may take a few minutes...
                      </p>
                    </div>
                    <span className="text-sm font-medium">{progressInfo.progress}%</span>
                  </div>
                  <Progress value={progressInfo.progress} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Website Information</CardTitle>
              <CardDescription>
                Enter your website details to get started with AI chatbot creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL Field */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Website URL *
                  </Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md border-input bg-muted text-muted-foreground">
                      <Globe className="w-4 h-4 mr-1" />
                      https://
                    </span>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      className="rounded-l-none"
                      placeholder="example.com"
                      aria-invalid={!!error}
                      disabled={isProcessing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your website URL (e.g., example.com or www.example.com)
                  </p>
                </div>

                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Website Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="My Awesome Website"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: A custom name for your website (will be auto-detected if left empty)
                  </p>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your website..."
                    rows={3}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Describe what your website is about to help improve chatbot responses
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-600 border border-red-200 rounded-md bg-red-50">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {progressInfo.message}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Website & Create Chatbot
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={isProcessing}>
                    <Link href="/dashboard/websites">
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className={`rounded-full p-1 mt-0.5 ${
                  ['creating', 'pending', 'scraping', 'processing', 'ready'].includes(scrapingStatus) 
                    ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    ['creating', 'pending', 'scraping', 'processing', 'ready'].includes(scrapingStatus)
                      ? 'bg-blue-600' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Website Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    We will automatically scan and analyze your website content
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className={`rounded-full p-1 mt-0.5 ${
                  ['processing', 'ready'].includes(scrapingStatus) 
                    ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    ['processing', 'ready'].includes(scrapingStatus)
                      ? 'bg-blue-600' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">AI Training</p>
                  <p className="text-xs text-muted-foreground">
                    Generate intelligent responses based on your content
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className={`rounded-full p-1 mt-0.5 ${
                  scrapingStatus === 'ready' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    scrapingStatus === 'ready' ? 'bg-green-600' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Chatbot Ready</p>
                  <p className="text-xs text-muted-foreground">
                    Get embed code to add chatbot to your website
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Public website (not password protected)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Valid SSL certificate (HTTPS)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Accessible content (not heavily JavaScript-dependent)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}