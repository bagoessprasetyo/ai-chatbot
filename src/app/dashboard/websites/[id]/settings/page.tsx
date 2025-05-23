/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/websites/[id]/settings/page.tsx
'use client'

import React, { useState, useEffect } from "react";
import { 
  Cog, 
  FileText, 
  Shield, 
  AlertTriangle, 
  Trash2, 
  Download, 
  RefreshCw,
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { scrapingService } from "@/lib/scraping-service";

interface Website {
  id: string
  user_id: string
  url: string
  title: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

interface SettingsItemProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsItem = ({ title, description, children }: SettingsItemProps) => {
  return (
    <div className="flex flex-col pb-4 space-y-2 border-b sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between sm:items-center last:border-0 last:pb-0">
      <div className="space-y-0.5">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center">
        {children}
      </div>
    </div>
  );
};

export default function WebsiteSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rescraping, setRescraping] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!user || !params.id) return

      try {
        const supabase = createClient()
        
        const { data: websiteData, error } = await supabase
          .from('websites')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        
        setWebsite(websiteData)
        setTitle(websiteData.title || '')
        setDescription(websiteData.description || '')
        setUrl(websiteData.url)

      } catch (error) {
        console.error('Error fetching website:', error)
        router.push('/dashboard/websites')
      } finally {
        setLoading(false)
      }
    }

    fetchWebsite()
  }, [user, params.id, router])

  const handleSaveGeneral = async () => {
    if (!website) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('websites')
        .update({
          title: title.trim() || null,
          description: description.trim() || null,
          url: url.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', website.id)

      if (error) throw error

      // Update local state
      setWebsite(prev => prev ? {
        ...prev,
        title: title.trim() || null,
        description: description.trim() || null,
        url: url.trim()
      } : null)

      alert('Settings saved successfully!')

    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRescrapeWebsite = async () => {
    if (!website) return

    const confirmed = confirm(
      'Are you sure you want to re-scrape this website? This will replace all existing content and may take a few minutes.'
    )
    
    if (!confirmed) return

    setRescraping(true)
    try {
      const result = await scrapingService.retryScraping(website.id, website.url)
      
      if (result.success) {
        alert('Website re-scraping started successfully! Check the status on the main website page.')
        router.push(`/dashboard/websites/${website.id}`)
      } else {
        alert('Failed to start re-scraping: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error re-scraping website:', error)
      alert('Failed to re-scrape website: ' + error.message)
    } finally {
      setRescraping(false)
    }
  }

  const handleDeleteWebsite = async () => {
    if (!website) return

    const confirmed = confirm(
      'Are you sure you want to delete this website? This will permanently delete the website, its chatbot, and all conversation history. This action cannot be undone.'
    )
    
    if (!confirmed) return

    // Double confirmation
    const doubleConfirmed = confirm(
      'This is your final warning. Deleting this website will permanently remove all data associated with it. Type "DELETE" to confirm.'
    )
    
    if (!doubleConfirmed) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', website.id)

      if (error) throw error

      alert('Website deleted successfully!')
      router.push('/dashboard/websites')

    } catch (error: any) {
      console.error('Error deleting website:', error)
      alert('Failed to delete website: ' + error.message)
    }
  }

  const handleExportData = async () => {
    if (!website) return

    try {
      const supabase = createClient()
      
      // Fetch all related data
      const { data: websiteData } = await supabase
        .from('websites')
        .select(`
          *,
          chatbots (
            *,
            conversations (*)
          )
        `)
        .eq('id', website.id)
        .single()

      if (websiteData) {
        const exportData = {
          website: websiteData,
          exported_at: new Date().toISOString(),
          version: '1.0'
        }

        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `website-${website.id}-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

    } catch (error: any) {
      console.error('Error exporting data:', error)
      alert('Failed to export data: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/websites/${params.id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 mt-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-gray-100 rounded h-96 animate-pulse"></div>
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
          <Link href={`/dashboard/websites/${website.id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Website Settings</h1>
          <p className="text-muted-foreground">
            Manage settings for {website.title || website.url}
          </p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Cog className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Danger Zone</span>
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your websites basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingsSection 
                title="Website Information" 
                description="Update your website's basic information."
              >
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-title">Website Title</Label>
                    <Input 
                      id="site-title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Awesome Website"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used as the chatbot name if not customized
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="site-description">Website Description</Label>
                    <Textarea 
                      id="site-description" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A brief description of your website"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps the AI understand your websites purpose
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="site-url">Website URL</Label>
                    <Input 
                      id="site-url" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Changing this will require re-scraping the website
                    </p>
                  </div>
                </div>
              </SettingsSection>
              
              <Separator />
              
              <SettingsSection 
                title="Website Status" 
                description="Current status of your website."
              >
                <div className="grid gap-4">
                  <SettingsItem
                    title="Current Status"
                    description={`Website is currently: ${website.status}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        website.status === 'ready' ? 'bg-green-500' :
                        website.status === 'scraping' ? 'bg-blue-500' :
                        website.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm capitalize">{website.status}</span>
                    </div>
                  </SettingsItem>
                  
                  <SettingsItem
                    title="Last Updated"
                    description="When the website was last updated"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(website.updated_at).toLocaleString()}
                    </span>
                  </SettingsItem>
                </div>
              </SettingsSection>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Content Management Tab */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Manage your websites scraped content and AI training data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingsSection 
                title="Content Scraping" 
                description="Manage how content is extracted from your website."
              >
                <div className="p-4 space-y-4 border border-blue-200 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-blue-900">Re-scrape Website</h4>
                    <p className="text-sm text-muted-foreground">
                      Update the AIs knowledge by re-analyzing your website content. This will replace all existing content.
                    </p>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleRescrapeWebsite} 
                        disabled={rescraping || website.status === 'scraping'}
                        className="gap-2"
                      >
                        {rescraping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Re-scraping...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Re-scrape Content
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
              
              <Separator />
              
              <SettingsSection 
                title="Content Statistics" 
                description="Current content statistics for your website."
              >
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold">
                        {website.status === 'ready' ? '✓' : '-'}
                      </div>
                      <p className="text-sm text-muted-foreground">Content Status</p>
                    </div>
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold">-</div>
                      <p className="text-sm text-muted-foreground">Pages Scraped</p>
                    </div>
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold">-</div>
                      <p className="text-sm text-muted-foreground">Last Scraped</p>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage security and access settings for your website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingsSection 
                title="Access Control" 
                description="Control who can access your website's chatbot."
              >
                <SettingsItem
                  title="Public Access"
                  description="Allow anyone to use the chatbot on your website."
                >
                  <Switch defaultChecked />
                </SettingsItem>
                
                <SettingsItem
                  title="Rate Limiting"
                  description="Limit the number of messages per user per hour."
                >
                  <Switch defaultChecked />
                </SettingsItem>
                
                <SettingsItem
                  title="Analytics Collection"
                  description="Collect anonymous usage analytics for improvement."
                >
                  <Switch defaultChecked />
                </SettingsItem>
              </SettingsSection>
            </CardContent>
            <CardFooter>
              <Button>Save Security Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6 space-y-6">
          <Card className="border-destructive">
            <CardHeader className="text-destructive">
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                These actions are permanent and cannot be undone. Please proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingsSection 
                title="Data Management" 
                description="Manage your website's data and settings."
              >
                <div className="p-4 space-y-4 border border-blue-200 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-blue-900">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all data associated with this website including content, conversations, and settings.
                    </p>
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={handleExportData} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export All Data
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 border rounded-lg border-destructive">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-destructive">Delete Website</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this website and all associated data including the chatbot and conversation history. This action cannot be undone.
                    </p>
                    <div className="flex justify-end">
                      <Button variant="destructive" onClick={handleDeleteWebsite} className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Website Permanently
                      </Button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}