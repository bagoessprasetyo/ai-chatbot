// src/app/dashboard/websites/new/page.tsx - FIXED VERSION
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  ArrowLeft, 
  Globe, 
  Lock, 
  Crown,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { createClient } from '@/lib/supabase'
import { scrapingService } from '@/lib/scraping-service'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewWebsitePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    subscription, 
    loading: subscriptionLoading, 
    canCreateWebsite, 
    refreshSubscription,
    getCurrentPlan,
    getUsagePercentage
  } = useSubscription()

  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // NEW: Scraping progress state
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'creating' | 'scraping' | 'processing' | 'complete' | 'error'>('idle')
  const [scrapingProgress, setScrapingProgress] = useState(0)
  const [websiteId, setWebsiteId] = useState<string | null>(null)

  // Check limits on component mount
  useEffect(() => {
    const checkLimits = async () => {
      if (!subscriptionLoading && !canCreateWebsite()) {
        toast.error("Website limit reached", {
          description: "You've reached your website limit. Upgrade to add more websites.",
          duration: 5000,
          action: {
            label: "Upgrade",
            onClick: () => router.push("/dashboard/settings?tab=billing")
          }
        })
      }
    }

    if (user && !subscriptionLoading) {
      checkLimits()
    }
  }, [user, subscriptionLoading, canCreateWebsite])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Website title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // NEW: Auto-scraping workflow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // First check if user can create website
    if (!canCreateWebsite()) {
      toast.error("Cannot create website", {
        description: "You've reached your website limit. Please upgrade your plan.",
        action: {
          label: "Upgrade",
          onClick: () => router.push("/dashboard/settings?tab=billing")
        }
      })
      return
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors")
      return
    }

    setLoading(true)
    setScrapingStatus('creating')
    setScrapingProgress(10)

    try {
      const supabase = createClient()

      // Check one more time before creating (in case of race conditions)
      const canCreate = await supabase.rpc('can_create_website', { 
        user_uuid: user?.id 
      })

      if (!canCreate.data) {
        throw new Error('Website creation limit reached. Please upgrade your plan.')
      }

      setScrapingProgress(20)

      // Step 1: Create website in database
      const { data: website, error } = await supabase
        .from('websites')
        .insert({
          user_id: user?.id,
          url: formData.url.trim(),
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        // Handle specific database trigger errors
        if (error.message.includes('Website creation limit reached')) {
          toast.error("Website limit reached", {
            description: "Upgrade your plan to create more websites",
            action: {
              label: "Upgrade",
              onClick: () => router.push("/dashboard/settings?tab=billing")
            }
          })
          return
        }
        throw error
      }

      setWebsiteId(website.id)
      setScrapingProgress(30)
      setScrapingStatus('scraping')

      // Step 2: Automatically start scraping process
      toast.success("Website created successfully!", {
        description: "Now starting content analysis..."
      })

      // Start the scraping workflow
      const scrapingResult = await scrapingService.scrapeWebsite({
        websiteId: website.id,
        url: formData.url.trim(),
        onStatusUpdate: (status) => {
          console.log('Scraping status update:', status)
          switch (status) {
            case 'scraping':
              setScrapingStatus('scraping')
              setScrapingProgress(50)
              break
            case 'processing':
              setScrapingStatus('processing')
              setScrapingProgress(80)
              break
            case 'ready':
              setScrapingStatus('complete')
              setScrapingProgress(100)
              break
            case 'error':
              setScrapingStatus('error')
              break
          }
        }
      })

      if (scrapingResult.success) {
        setScrapingStatus('complete')
        setScrapingProgress(100)
        
        // Refresh subscription data to update usage counts
        await refreshSubscription()

        toast.success("Website setup complete!", {
          description: `Analyzed ${scrapingResult.pagesScraped} pages. Your chatbot is ready!`
        })

        // Wait a moment to show completion, then redirect
        setTimeout(() => {
          router.push(`/dashboard/websites/${website.id}`)
        }, 2000)

      } else {
        setScrapingStatus('error')
        toast.error("Content analysis failed", {
          description: scrapingResult.error || "Please try again or contact support"
        })
      }

    } catch (error: any) {
      console.error('Error creating website:', error)
      setScrapingStatus('error')
      
      if (error.message.includes('limit reached') || error.message.includes('Upgrade')) {
        toast.error("Website limit reached", {
          description: error.message,
          action: {
            label: "Upgrade",
            onClick: () => router.push("/dashboard/settings?tab=billing")
          }
        })
      } else {
        toast.error("Failed to create website", {
          description: error.message || "Please try again"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p>Loading your subscription details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const websiteUsage = getUsagePercentage('websites')
  const isAtLimit = !canCreateWebsite()

  // NEW: Progress display
  const getProgressMessage = () => {
    switch (scrapingStatus) {
      case 'creating':
        return 'Creating website...'
      case 'scraping':
        return 'Analyzing website content...'
      case 'processing':
        return 'Setting up AI chatbot...'
      case 'complete':
        return 'Setup complete! Redirecting...'
      case 'error':
        return 'Setup failed. Please try again.'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild disabled={loading}>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Website</h1>
            <p className="text-muted-foreground">
              Connect your website to create an AI chatbot
            </p>
          </div>
        </div>
        
        {subscription && (
          <div className="text-right">
            <Badge variant="outline">{getCurrentPlan()}</Badge>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription.websites_used} / {subscription.websites_limit === -1 ? '∞' : subscription.websites_limit} websites used
            </p>
          </div>
        )}
      </div>

      {/* NEW: Progress indicator */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Setting up your website</h3>
                <p className="text-sm text-blue-700">{getProgressMessage()}</p>
              </div>
            </div>
            <Progress value={scrapingProgress} className="h-2" />
            <p className="mt-2 text-xs text-blue-600">{scrapingProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Limit Warning */}
      {isAtLimit && (
        <Alert className="border-red-200 bg-red-50">
          <Lock className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Website limit reached!</strong>
                <br />
                You've used all {subscription?.websites_limit} of your website slots. 
                Upgrade your plan to add more websites.
              </div>
              <Link href="/dashboard/settings?tab=billing">
                <Button size="sm" variant="destructive">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Warning */}
      {!isAtLimit && websiteUsage >= 80 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Approaching website limit</strong>
                <br />
                You're using {websiteUsage.toFixed(0)}% of your website quota. 
                Consider upgrading to avoid hitting limits.
              </div>
              <Link href="/dashboard/settings?tab=billing">
                <Button size="sm" variant="outline">
                  View Plans
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Progress */}
      {subscription && subscription.websites_limit !== -1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Website Usage</span>
              <span className="text-sm text-muted-foreground">
                {subscription.websites_used} / {subscription.websites_limit}
              </span>
            </div>
            <Progress 
              value={websiteUsage} 
              className={`h-2 ${
                isAtLimit ? '[&>div]:bg-red-500' : 
                websiteUsage >= 80 ? '[&>div]:bg-orange-500' : 
                '[&>div]:bg-green-500'
              }`}
            />
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Website Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                disabled={loading || isAtLimit}
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && (
                <p className="text-sm text-red-600">{errors.url}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the full URL of your website (including https://)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Website Title *</Label>
              <Input
                id="title"
                placeholder="My Awesome Website"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={loading || isAtLimit}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A descriptive name for your website
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your website..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading || isAtLimit}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Describe what your website is about
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || isAtLimit}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {scrapingStatus === 'creating' ? 'Creating...' : 
                     scrapingStatus === 'scraping' ? 'Analyzing...' : 
                     scrapingStatus === 'processing' ? 'Setting up...' : 
                     'Processing...'}
                  </>
                ) : isAtLimit ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Limit Reached
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create & Analyze Website
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href="/dashboard">
                  Cancel
                </Link>
              </Button>
            </div>

            {/* NEW: Process explanation */}
            {!isAtLimit && (
              <div className="p-4 text-sm rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                  <li>We'll create your website entry</li>
                  <li>Analyze and extract content from your website</li>
                  <li>Generate an AI assistant trained on your content</li>
                  <li>Set up your chatbot and embed code</li>
                </ol>
                <p className="mt-2 text-xs text-gray-500">
                  This process typically takes 1-3 minutes depending on your website size.
                </p>
              </div>
            )}

            {isAtLimit && (
              <div className="p-4 text-center rounded-lg bg-gray-50">
                <p className="mb-2 text-sm text-gray-600">
                  Need more websites? Upgrade your plan to continue.
                </p>
                <Link href="/dashboard/settings?tab=billing">
                  <Button size="sm">
                    <Crown className="w-4 h-4 mr-2" />
                    View Upgrade Options
                  </Button>
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Plan Comparison - only show when at limit */}
      {isAtLimit && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade for More Websites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Starter</h3>
                <p className="text-2xl font-bold">$19/month</p>
                <p className="text-sm text-muted-foreground">5 websites</p>
              </div>
              <div className="p-4 border border-blue-500 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Professional</h3>
                  <Badge>Popular</Badge>
                </div>
                <p className="text-2xl font-bold">$49/month</p>
                <p className="text-sm text-muted-foreground">25 websites</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Enterprise</h3>
                <p className="text-2xl font-bold">$99/month</p>
                <p className="text-sm text-muted-foreground">Unlimited websites</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link href="/dashboard/settings?tab=billing">
                <Button>
                  Compare All Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}