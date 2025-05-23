/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/settings/page.tsx
'use client'

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  CreditCard, 
  Key, 
  Bell, 
  Shield, 
  Save,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Trash2,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { 
  useUserSettings, 
  useApiKeys, 
  useSubscription, 
  useSecuritySettings 
} from "@/hooks/useSettings";
import { 
  PLANS,
  CreateApiKeyRequest 
} from "@/lib/types/settings";

export default function SettingsPage() {
  const { user } = useAuth()
  
  // Use custom hooks for data management
  const { 
    settings: userSettings, 
    loading: settingsLoading, 
    error: settingsError,
    updateSettings: updateUserSettings 
  } = useUserSettings()
  
  const { 
    apiKeys, 
    loading: apiKeysLoading, 
    error: apiKeysError,
    createApiKey: createNewApiKey,
    // updateApiKey,
    deleteApiKey 
  } = useApiKeys()
  
  const { 
    subscription, 
    loading: subscriptionLoading,
    error: subscriptionError 
  } = useSubscription()
  
  const { 
    securitySettings, 
    loading: securityLoading,
    error: securityError,
    updateSecuritySettings 
  } = useSecuritySettings()
  
  // Profile state (separate from user settings)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  })
  const [profileLoading, setProfileLoading] = useState(true)
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [showCreateApiKey, setShowCreateApiKey] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("account")

  // Load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setProfileLoading(true)
        const supabase = createClient()
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            email: profileData.email || user.email || '',
            avatar_url: profileData.avatar_url || ''
          })
        } else {
          // Set default values from auth user
          setProfile({
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Profile management
  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Notification settings management
  const handleSaveNotifications = async () => {
    if (!userSettings) return

    setSaving(true)
    try {
      await updateUserSettings({
        email_notifications: userSettings.email_notifications,
        conversation_alerts: userSettings.conversation_alerts,
        weekly_reports: userSettings.weekly_reports,
        security_alerts: userSettings.security_alerts,
        marketing_emails: userSettings.marketing_emails
      })
      alert('Notification settings saved successfully!')
    } catch (error) {
      console.error('Error saving notifications:', error)
      alert('Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  // API key management
  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) return

    setSaving(true)
    try {
      const request: CreateApiKeyRequest = {
        name: newApiKeyName.trim(),
        permissions: []
      }

      const newKey = await createNewApiKey(request)
      setNewApiKey(newKey.key) // Store the full key to show once
      setNewApiKeyName('')
      setShowCreateApiKey(false)
    } catch (error) {
      console.error('Error creating API key:', error)
      alert('Failed to create API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      await deleteApiKey(keyId)
    } catch (error) {
      console.error('Error deleting API key:', error)
      alert('Failed to delete API key')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  // Security settings management
  const handleUpdateSecuritySetting = async (key: string, value: any) => {
    if (!securitySettings) return

    try {
      await updateSecuritySettings({ [key]: value })
    } catch (error) {
      console.error('Error updating security setting:', error)
      alert('Failed to update security setting')
    }
  }

  const currentPlan = PLANS.find(plan => plan.id === subscription?.plan_id) || PLANS[0]
  const isLoading = settingsLoading || apiKeysLoading || subscriptionLoading || securityLoading || profileLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-100 rounded animate-pulse" />
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Error display */}
      {(settingsError || apiKeysError || subscriptionError || securityError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                {settingsError || apiKeysError || subscriptionError || securityError}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New API Key Created Dialog */}
      {newApiKey && (
        <Dialog open={!!newApiKey} onOpenChange={() => setNewApiKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created Successfully</DialogTitle>
              <DialogDescription>
                Make sure to copy your API key now. You wont be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Your new API key</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={newApiKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newApiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewApiKey(null)}>
                I have saved my API key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is your login email and primary contact method
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={profile.avatar_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
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

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View your account details and membership information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Account ID</span>
                  <span className="font-mono text-sm text-muted-foreground">{user?.id}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Member since</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge variant="secondary">{currentPlan.name}</Badge>
                </div>
                {subscription && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Usage this month</span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.monthly_conversations_used} / {subscription.monthly_conversations_limit} conversations
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userSettings && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={userSettings.email_notifications}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateUserSettings({ email_notifications: checked })
                        } catch (error) {
                          console.error('Error updating setting:', error)
                        }
                      }}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="conversation_alerts">Conversation Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your chatbot receives messages
                      </p>
                    </div>
                    <Switch
                      id="conversation_alerts"
                      checked={userSettings.conversation_alerts}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateUserSettings({ conversation_alerts: checked })
                        } catch (error) {
                          console.error('Error updating setting:', error)
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly_reports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly analytics and performance reports
                      </p>
                    </div>
                    <Switch
                      id="weekly_reports"
                      checked={userSettings.weekly_reports}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateUserSettings({ weekly_reports: checked })
                        } catch (error) {
                          console.error('Error updating setting:', error)
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="security_alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important security notifications (recommended)
                      </p>
                    </div>
                    <Switch
                      id="security_alerts"
                      checked={userSettings.security_alerts}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateUserSettings({ security_alerts: checked })
                        } catch (error) {
                          console.error('Error updating setting:', error)
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing_emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Product updates, tips, and promotional content
                      </p>
                    </div>
                    <Switch
                      id="marketing_emails"
                      checked={userSettings.marketing_emails}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateUserSettings({ marketing_emails: checked })
                        } catch (error) {
                          console.error('Error updating setting:', error)
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} disabled={saving || !userSettings}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access
                  </CardDescription>
                </div>
                <Dialog open={showCreateApiKey} onOpenChange={setShowCreateApiKey}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for accessing your chatbots programmatically.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="api_key_name">API Key Name</Label>
                        <Input
                          id="api_key_name"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="e.g., Production API, Development Key"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateApiKey(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateApiKey} 
                        disabled={!newApiKeyName.trim() || saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Key'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 font-mono text-sm bg-gray-100 rounded">
                            {visibleKeys.has(apiKey.id) 
                              ? `${apiKey.key_prefix}[HIDDEN]` 
                              : apiKey.key_prefix
                            }
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_prefix)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                          <span>
                            Last used: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No API keys created yet. Create your first API key to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Learn how to use the WebBot AI API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use your API keys to integrate WebBot AI into your applications. 
                  View our comprehensive API documentation for examples and endpoints.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Documentation
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      API Examples
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{currentPlan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.status === 'trialing' && subscription.trial_end
                        ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString()}`
                        : `${subscription?.monthly_conversations_used || 0} / ${subscription?.monthly_conversations_limit || 0} conversations used`
                      }
                    </p>
                  </div>
                  <Badge variant="secondary">Current Plan</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  {PLANS.slice(1).map((plan) => (
                    <Card key={plan.id} className={plan.popular ? "border-blue-200" : ""}>
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="text-3xl font-bold">
                          ${(plan.price / 100).toFixed(0)}
                          <span className="text-sm font-normal">/mo</span>
                        </div>
                        {plan.popular && (
                          <Badge className="mx-auto">Most Popular</Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant={plan.popular ? "default" : "outline"} 
                          className="w-full"
                          disabled={subscription?.plan_id === plan.id}
                        >
                          {subscription?.plan_id === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                {subscription?.status === 'trialing' 
                  ? "No billing history available. You are currently on the free trial."
                  : "No billing history available yet."
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings?.two_factor_enabled 
                        ? 'Two-factor authentication is enabled'
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateSecuritySetting('two_factor_enabled', !securitySettings?.two_factor_enabled)}
                >
                  {securitySettings?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings?.login_alerts_enabled || false}
                  onCheckedChange={(checked) => handleUpdateSecuritySetting('login_alerts_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Suspicious Activity Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of unusual account activity
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings?.suspicious_activity_alerts || false}
                  onCheckedChange={(checked) => handleUpdateSecuritySetting('suspicious_activity_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings?.password_changed_at
                        ? `Last changed ${new Date(securitySettings.password_changed_at).toLocaleDateString()}`
                        : 'Change your account password'
                      }
                    </p>
                  </div>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Delete Account</p>
                    <p className="text-sm text-red-600">
                      Permanently delete your account and all data
                    </p>
                  </div>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'} • Last seen now
                    </p>
                  </div>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <div className="py-4 text-center text-muted-foreground">
                  No other active sessions
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}