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
// import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
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
//   Palette,
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

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
}

interface NotificationSettings {
  email_notifications: boolean
  conversation_alerts: boolean
  weekly_reports: boolean
  security_alerts: boolean
  marketing_emails: boolean
}

interface APIKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  is_active: boolean
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    conversation_alerts: true,
    weekly_reports: false,
    security_alerts: true,
    marketing_emails: false
  })
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [showCreateApiKey, setShowCreateApiKey] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        } else {
          // Create profile if it doesn't exist
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            created_at: user.created_at || new Date().toISOString()
          })
        }

        // Mock API keys data
        setApiKeys([
          {
            id: '1',
            name: 'Production API',
            key: 'wb_sk_1234567890abcdef',
            created_at: '2024-01-15T10:00:00Z',
            last_used: '2024-01-20T14:30:00Z',
            is_active: true
          },
          {
            id: '2',
            name: 'Development API',
            key: 'wb_sk_abcdef1234567890',
            created_at: '2024-01-10T09:00:00Z',
            last_used: null,
            is_active: true
          }
        ])

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleSaveProfile = async () => {
    if (!profile || !user) return

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

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // In a real app, you'd save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Notification settings saved!')
    } catch (error) {
      console.error('Error saving notifications:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) return

    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: `wb_sk_${Math.random().toString(36).substr(2, 16)}`,
      created_at: new Date().toISOString(),
      last_used: null,
      is_active: true
    }

    setApiKeys([...apiKeys, newKey])
    setNewApiKeyName('')
    setShowCreateApiKey(false)
  }

  const handleDeleteApiKey = (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter(key => key.id !== keyId))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
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

  if (loading) {
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

      <Tabs defaultValue="account" className="w-full">
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
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
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
                    value={profile?.avatar_url || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, avatar_url: e.target.value } : null)}
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
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge variant="secondary">Free Trial</Badge>
                </div>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email_notifications: checked }))
                  }
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
                  checked={notifications.conversation_alerts}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, conversation_alerts: checked }))
                  }
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
                  checked={notifications.weekly_reports}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, weekly_reports: checked }))
                  }
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
                  checked={notifications.security_alerts}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, security_alerts: checked }))
                  }
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
                  checked={notifications.marketing_emails}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, marketing_emails: checked }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
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
                      <Button onClick={handleCreateApiKey} disabled={!newApiKeyName.trim()}>
                        Create Key
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
                            {visibleKeys.has(apiKey.id) ? apiKey.key : `${apiKey.key.slice(0, 8)}${"*".repeat(apiKey.key.length - 8)}`}
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
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                          <span>
                            Last used: {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}
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
                    <h4 className="font-medium">Free Trial</h4>
                    <p className="text-sm text-muted-foreground">
                      14 days remaining • Up to 100 conversations
                    </p>
                  </div>
                  <Badge variant="secondary">Current Plan</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-blue-200">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Starter</CardTitle>
                      <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">500 conversations/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">1 website</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Email support</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Upgrade to Starter</Button>
                    </CardFooter>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Professional</CardTitle>
                      <div className="text-3xl font-bold">$79<span className="text-sm font-normal">/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">2,000 conversations/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">3 websites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Upgrade to Pro</Button>
                    </CardFooter>
                  </Card>

                  <Card className="border-purple-200">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Business</CardTitle>
                      <div className="text-3xl font-bold">$199<span className="text-sm font-normal">/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">10,000 conversations/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">10 websites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Dedicated support</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Upgrade to Business</Button>
                    </CardFooter>
                  </Card>
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
                No billing history available. You are currently on the free trial.
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
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
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
                      Chrome on macOS • Last seen now
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