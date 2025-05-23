/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/websites/[id]/page.tsx
'use client'

import React, { useEffect, useState } from "react";
import { 
  Bot, 
  Code, 
  FileCode, 
  Info, 
  Settings,
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCheck,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Website {
  id: string
  user_id: string
  url: string
  title: string | null
  description: string | null
  status: 'pending' | 'scraping' | 'ready' | 'error'
  scraped_content: any | null
  system_prompt: string | null
  created_at: string
  updated_at: string
}

interface Chatbot {
  id: string
  website_id: string
  name: string
  config: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function WebsiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [website, setWebsite] = useState<Website | null>(null)
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchWebsiteData = async () => {
      if (!user || !params.id) return

      try {
        const supabase = createClient()
        
        // Fetch website data
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (websiteError) throw websiteError
        setWebsite(websiteData)

        // Fetch chatbot data
        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('*')
          .eq('website_id', params.id)
          .maybeSingle()

        if (chatbotError && chatbotError.code !== 'PGRST116') {
          console.error('Error fetching chatbot:', chatbotError)
        } else if (chatbotData) {
          setChatbot(chatbotData)
        }

      } catch (error) {
        console.error('Error fetching website data:', error)
        router.push('/dashboard/websites')
      } finally {
        setLoading(false)
      }
    }

    fetchWebsiteData()
  }, [user, params.id, router])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      scraping: "bg-blue-100 text-blue-800",
      ready: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800"
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const copyEmbedCode = async () => {
    if (!website || !chatbot) return
    
    const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/chatbot-widget.js';
    script.setAttribute('data-chatbot-id', '${chatbot.id}');
    script.setAttribute('data-website-id', '${website.id}');
    document.head.appendChild(script);
  })();
</script>`

    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/websites">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 mt-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="bg-gray-100 rounded h-96 animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/websites">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Website Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/websites">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{website.title || 'Untitled Website'}</h1>
            {getStatusBadge(website.status)}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ExternalLink className="w-4 h-4" />
            <a 
              href={website.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              {website.url}
            </a>
            <span className="mx-2">•</span>
            <span>Created {new Date(website.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Chatbot
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Embed Code
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Website Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Website Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {website.title || 'No title available'}
                      </p>
                    </div>
                    <div>
                      <Label>URL</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{website.url}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {website.description || 'No description provided'}
                      </p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">{getStatusBadge(website.status)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scraping Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="w-5 h-5" />
                      Scraping Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {website.scraped_content ? (
                      <>
                        <div>
                          <Label>Pages Scraped</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {website.scraped_content.totalPages || 0} pages
                          </p>
                        </div>
                        <div>
                          <Label>Content Length</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {website.scraped_content.mainContent?.length.toLocaleString() || 0} characters
                          </p>
                        </div>
                        <div>
                          <Label>Last Updated</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(website.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No content available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Chatbot Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Chatbot Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chatbot ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="p-4 text-center border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">Active</div>
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                      <div className="p-4 text-center border rounded-lg">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">Conversations</p>
                      </div>
                      <div className="p-4 text-center border rounded-lg">
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium">No chatbot configured</h3>
                      <p className="text-sm text-muted-foreground">Create a chatbot to start helping your visitors</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Scraped Content Preview</h3>
                  <p className="text-muted-foreground">Content extracted from your website</p>
                </div>
                
                {website.scraped_content ? (
                  <div className="space-y-4">
                    {/* Page Titles */}
                    {website.scraped_content.titles && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Page Titles</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {website.scraped_content.titles.map((title: string, index: number) => (
                              <div key={index} className="p-2 text-sm border rounded">
                                {title}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Main Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Extracted Content</CardTitle>
                        <CardDescription>
                          First 2000 characters of your website content
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          className="min-h-[300px] font-mono text-sm"
                          readOnly
                          value={website.scraped_content.mainContent?.substring(0, 2000) + '...' || 'No content available'}
                        />
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium">No content available</h3>
                      <p className="text-sm text-muted-foreground">Content will appear here after scraping is complete</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Chatbot Tab */}
            <TabsContent value="chatbot" className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">AI System Prompt</h3>
                  <p className="text-muted-foreground">The instructions that guide your chatbots responses</p>
                </div>
                
                {website.system_prompt ? (
                  <Card>
                    <CardContent className="pt-6">
                      <Textarea 
                        className="min-h-[300px] font-mono text-sm"
                        readOnly
                        value={website.system_prompt}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium">No AI prompt generated</h3>
                      <p className="text-sm text-muted-foreground">AI prompt will be created after content processing</p>
                    </CardContent>
                  </Card>
                )}

                {chatbot && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Chatbot Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={chatbot.name} className="mt-1" />
                      </div>
                      <div>
                        <Label>Welcome Message</Label>
                        <Input 
                          value={chatbot.config?.welcome_message || ''} 
                          className="mt-1" 
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="active" 
                          checked={chatbot.is_active}
                        />
                        <Label htmlFor="active">Chatbot Active</Label>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Embed Code Tab */}
            <TabsContent value="embed" className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Embed Your Chatbot</h3>
                  <p className="text-muted-foreground">
                    Copy this code and paste it into your websites HTML
                  </p>
                </div>
                
                {chatbot ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea 
                        className="h-32 font-mono text-sm resize-none bg-muted"
                        readOnly
                        value={`<script>
(function() {
  var script = document.createElement('script');
  script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/chatbot-widget.js';
  script.setAttribute('data-chatbot-id', '${chatbot.id}');
  script.setAttribute('data-website-id', '${website.id}');
  document.head.appendChild(script);
})();
</script>`}
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={copyEmbedCode}
                      >
                        {copied ? (
                          <>
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Installation Instructions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Copy the embed code above</li>
                          <li>Paste it into your websites HTML, just before the closing <code>&lt;/body&gt;</code> tag</li>
                          <li>Save your changes and refresh your website</li>
                          <li>The chatbot will appear in the bottom-right corner of your site</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium">Chatbot not ready</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete the scraping process to get your embed code
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}