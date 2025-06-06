/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/chatbots/page.tsx - Updated with name field and modern icons
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Bot, 
  Plus, 
  Settings, 
  Palette, 
  Lock,
  Crown,
  Save,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  AlertTriangle,
  User,
  MessageCircle,
  Headphones,
  Heart,
  Star,
  Zap,
  Globe,
  Shield,
  Home,
  Mail,
  Phone,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Camera,
  Music,
  Gamepad2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { createClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-utils'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { toast } from 'sonner'
import Link from 'next/link'
import { showAlert } from '@/components/ui/alert-dialog-component'

interface ChatbotConfig {
  theme: 'default' | 'minimal' | 'modern' | 'rounded' | 'floating'
  position: 'bottom-right' | 'bottom-left' | 'bottom-center'
  primary_color: string
  secondary_color?: string
  text_color?: string
  background_color?: string
  border_radius?: number
  avatar_style: 'bot' | 'circle' | 'square' | 'custom'
  avatar_icon?: string
  welcome_message: string
  placeholder_text?: string
  animation_style: 'none' | 'bounce' | 'pulse' | 'fade'
  bubble_style: 'modern' | 'classic' | 'minimal'
  show_branding: boolean
  custom_css?: string
}

interface Chatbot {
  id: string
  name: string
  config: ChatbotConfig
  is_active: boolean
  created_at: string
  website_title: string
  website_url: string
  website_id: string
}

const defaultConfig: ChatbotConfig = {
  theme: 'default',
  position: 'bottom-right',
  primary_color: '#3B82F6',
  secondary_color: '#EFF6FF',
  text_color: '#1F2937',
  background_color: '#FFFFFF',
  border_radius: 12,
  avatar_style: 'bot',
  welcome_message: 'Hello! How can I help you today?',
  placeholder_text: 'Type your message...',
  animation_style: 'none',
  bubble_style: 'modern',
  show_branding: true
}

// Color presets
const colorPresets = [
  { name: 'Blue', primary: '#3B82F6', secondary: '#EFF6FF' },
  { name: 'Green', primary: '#10B981', secondary: '#ECFDF5' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#F3E8FF' },
  { name: 'Red', primary: '#EF4444', secondary: '#FEF2F2' },
  { name: 'Orange', primary: '#F59E0B', secondary: '#FFFBEB' },
  { name: 'Pink', primary: '#EC4899', secondary: '#FDF2F8' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#EEF2FF' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#F0FDFA' }
]

// Updated modern flat avatar icons
const avatarIcons = [
  { name: 'Bot', icon: Bot, color: '#3B82F6' },
  { name: 'Support', icon: Headphones, color: '#10B981' },
  { name: 'Assistant', icon: User, color: '#8B5CF6' },
  { name: 'Chat', icon: MessageCircle, color: '#F59E0B' },
  { name: 'Heart', icon: Heart, color: '#EC4899' },
  { name: 'Star', icon: Star, color: '#EAB308' },
  { name: 'Lightning', icon: Zap, color: '#EF4444' },
  { name: 'Globe', icon: Globe, color: '#06B6D4' },
  { name: 'Shield', icon: Shield, color: '#84CC16' },
  { name: 'Home', icon: Home, color: '#F97316' },
  { name: 'Mail', icon: Mail, color: '#6366F1' },
  { name: 'Phone', icon: Phone, color: '#14B8A6' },
  { name: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { name: 'Business', icon: Briefcase, color: '#64748B' },
  { name: 'Education', icon: GraduationCap, color: '#7C3AED' },
  { name: 'Camera', icon: Camera, color: '#DC2626' },
  { name: 'Music', icon: Music, color: '#059669' },
  { name: 'Gaming', icon: Gamepad2, color: '#7C2D12' }
]

export default function ChatbotsPage() {
  return (
    <ErrorBoundary>
      <ChatbotsPageContent />
    </ErrorBoundary>
  )
}

function ChatbotsPageContent() {
  const { user } = useAuth()
  const { 
    subscription, 
    loading: subscriptionLoading, 
    canCreateChatbot,
    getUsagePercentage 
  } = useSubscription()

  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
  const [editingConfig, setEditingConfig] = useState<ChatbotConfig>(defaultConfig)
  const [editingName, setEditingName] = useState<string>('') // ✅ New state for chatbot name
  const [saving, setSaving] = useState(false)
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)

  useEffect(() => {
    if (user) {
      fetchChatbots()
    }
  }, [user])

  const fetchChatbots = async () => {
    try {
      const supabase = createClient()
      const { data: chatbots, error } = await supabase
        .from('chatbots')
        .select(`
          id,
          name,
          config,
          is_active,
          created_at,
          website_id,
          websites!inner (
            title,
            url,
            user_id
          )
        `)
        .eq('websites.user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setChatbots(
        (chatbots || []).map((bot: any) => ({
          id: bot.id,
          name: bot.name,
          config: bot.config,
          is_active: bot.is_active,
          created_at: bot.created_at,
          website_id: bot.website_id,
          website_title: bot.websites?.[0]?.title || '',
          website_url: bot.websites?.[0]?.url || ''
        }))
      )
    } catch (error) {
      console.error('Error fetching chatbots:', error)
      toast.error(handleError(error, 'Failed to load chatbots'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (chatbotId: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      
      console.log('Toggling chatbot status:', { chatbotId, isActive })
      
      // Use RPC function for reliable operation
      const { data, error } = await supabase.rpc('toggle_chatbot_status', {
        chatbot_id: chatbotId,
        new_status: isActive
      })

      console.log('RPC response:', { data, error })

      if (error) {
        console.error('RPC error:', error)
        throw new Error(error.message || 'Failed to update chatbot status')
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to update chatbot status')
      }

      // Update local state
      setChatbots(prev => prev.map(bot => 
        bot.id === chatbotId ? { ...bot, is_active: isActive } : bot
      ))

      toast.success(`Chatbot ${isActive ? 'activated' : 'deactivated'}`)
    } catch (error: any) {
      console.error('Error toggling chatbot:', error)
      // Show error alert instead of toast for important errors
      showAlert.error(
        'Failed to Update Chatbot', 
        error.message || 'There was an issue updating your chatbot status. Please try again.'
      )
    }
  }

  const handleCustomize = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot)
    setEditingConfig({ ...defaultConfig, ...chatbot.config })
    setEditingName(chatbot.name) // ✅ Set the chatbot name
    setShowCustomizeDialog(true)
  }

  const handleSaveConfig = async () => {
    if (!selectedChatbot) return

    setSaving(true)
    try {
      console.log('Saving config:', { 
        chatbotId: selectedChatbot.id, 
        config: editingConfig, 
        name: editingName,
        user: user // ✅ Use the editing name state
      })
      
      // Use the standard API endpoint for config updates
      const response = await fetch(`/api/chatbots/${selectedChatbot.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: editingConfig,
          user: user,
          name: editingName // ✅ Send the edited name
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Config save error:', errorData)
        throw new Error(errorData.error || 'Failed to save configuration')
      }

      const result = await response.json()
      console.log('Configuration saved successfully:', result)

      // Update local state
      setChatbots(prev => prev.map(bot => 
        bot.id === selectedChatbot.id 
          ? { ...bot, config: editingConfig, name: editingName } // ✅ Update name too
          : bot
      ))

      toast.success('Chatbot customization saved!')
      setShowCustomizeDialog(false)
      setSelectedChatbot(null)
    } catch (error: any) {
      console.error('Error saving config:', error)
      showAlert.error(
        'Failed to Save Configuration',
        error.message || 'There was an issue saving your chatbot configuration. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChatbot = async (chatbotId: string) => {
    const chatbot = chatbots.find(bot => bot.id === chatbotId)
    const chatbotName = chatbot?.name || 'this chatbot'

    try {
      await showAlert.delete(
        'Delete Chatbot',
        `Are you sure you want to delete "${chatbotName}"? This will permanently remove the chatbot and all its conversation history. This action cannot be undone.`,
        async () => {
          const supabase = createClient()
          
          console.log('Deleting chatbot:', chatbotId)
          
          // Use RPC function for reliable operation
          const { data, error } = await supabase.rpc('delete_chatbot', {
            chatbot_id: chatbotId
          })

          console.log('Delete RPC response:', { data, error })

          if (error) {
            console.error('RPC error:', error)
            throw new Error(error.message || 'Failed to delete chatbot')
          }

          if (data && !data.success) {
            throw new Error(data.error || 'Failed to delete chatbot')
          }

          // Update local state
          setChatbots(prev => prev.filter(bot => bot.id !== chatbotId))
          toast.success('Chatbot deleted successfully')
        }
      )
    } catch (error: any) {
      console.error('Error deleting chatbot:', error)
      showAlert.error(
        'Failed to Delete Chatbot',
        error.message || 'There was an issue deleting your chatbot. Please try again.'
      )
    }
  }

  const generateEmbedCode = (chatbot: Chatbot) => {
    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://yourdomain.com/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbot.id}');
    script.setAttribute('data-website-id', '${chatbot.website_id}');
    document.head.appendChild(script);
  })();
</script>`
  }

  const copyEmbedCode = (chatbot: Chatbot) => {
    navigator.clipboard.writeText(generateEmbedCode(chatbot))
      .then(() => {
        toast.success('Embed code copied to clipboard!')
      })
      .catch(() => {
        showAlert.error(
          'Copy Failed',
          'Unable to copy embed code to clipboard. Please copy it manually from the embed tab.'
        )
      })
  }

  const ChatbotPreview = ({ config, name }: { config: ChatbotConfig; name: string }) => {
    // Find the selected avatar icon
    const selectedIcon = avatarIcons.find(icon => icon.name === config.avatar_icon) || avatarIcons[0]
    const IconComponent = selectedIcon.icon

    return (
      <div className="relative h-48 p-4 overflow-hidden border rounded-lg bg-gray-50">
        {/* Chatbot name display */}
        <div className="mb-2 text-sm font-medium text-gray-600">
          {name}
        </div>
        
        <div className="absolute bottom-4 right-4">
          <div 
            className={`
              w-14 h-14 shadow-lg flex items-center justify-center cursor-pointer
              transition-all duration-200 hover:scale-105
              ${config.animation_style === 'bounce' ? 'animate-bounce' : ''}
              ${config.animation_style === 'pulse' ? 'animate-pulse' : ''}
            `}
            style={{ 
              backgroundColor: config.primary_color,
              borderRadius: config.avatar_style === 'square' ? '8px' : 
                           config.avatar_style === 'circle' ? '50%' : '12px'
            }}
          >
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Chat bubble preview */}
        <div className="absolute bottom-20 right-4">
          <div 
            className="max-w-xs p-3 text-sm shadow-lg"
            style={{ 
              backgroundColor: config.background_color,
              color: config.text_color,
              borderRadius: `${config.border_radius}px`,
              border: `1px solid ${config.secondary_color}`
            }}
          >
            {config.welcome_message}
          </div>
        </div>
      </div>
    )
  }

  if (loading || subscriptionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-64 h-10" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  const chatbotUsage = getUsagePercentage('chatbots')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbots</h1>
          <p className="text-muted-foreground">
            Manage and customize your AI chatbots
          </p>
        </div>
        
        {subscription && (
          <div className="text-right">
            <Badge variant="outline">
              {subscription.chatbots_used} / {subscription.chatbots_limit === -1 ? '∞' : subscription.chatbots_limit} used
            </Badge>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription.plan_name} Plan
            </p>
          </div>
        )}
      </div>

      {/* Usage Warning */}
      {chatbotUsage >= 80 && (
        <Alert className={`${chatbotUsage >= 100 ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <AlertTriangle className={`w-4 h-4 ${chatbotUsage >= 100 ? 'text-red-600' : 'text-orange-600'}`} />
          <AlertDescription className={chatbotUsage >= 100 ? 'text-red-800' : 'text-orange-800'}>
            <div className="flex items-center justify-between">
              <span>
                {chatbotUsage >= 100 
                  ? 'Chatbot limit reached! Upgrade to create more chatbots.'
                  : `You're using ${chatbotUsage.toFixed(0)}% of your chatbot quota.`
                }
              </span>
              <Link href="/dashboard/settings?tab=billing">
                <Button size="sm" variant={chatbotUsage >= 100 ? "destructive" : "outline"}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {chatbots.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No chatbots yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first website to automatically generate a chatbot, or add a new website to get started.
            </p>
            <Link href="/dashboard/websites/new">
              <Button disabled={!canCreateChatbot()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Website
                {!canCreateChatbot() && <Lock className="w-4 h-4 ml-2" />}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Chatbots Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((chatbot) => (
            <Card key={chatbot.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" title={chatbot.name}>
                      {chatbot.name}
                    </CardTitle>
                    <p className="text-sm truncate text-muted-foreground" title={chatbot.website_url}>
                      {chatbot.website_title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={chatbot.is_active}
                      onCheckedChange={(checked) => handleToggleActive(chatbot.id, checked)}
                    />
                    <Badge variant={chatbot.is_active ? "default" : "secondary"}>
                      {chatbot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preview */}
                <ChatbotPreview config={chatbot.config} name={chatbot.name} />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCustomize(chatbot)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyEmbedCode(chatbot)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={chatbot.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChatbot(chatbot.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="text-xs text-muted-foreground">
                  Created {new Date(chatbot.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Customize Chatbot - {selectedChatbot?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                {/* ✅ New General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chatbot Name</Label>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Enter chatbot name"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name is used for internal organization and may be displayed to users.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select 
                      value={editingConfig.theme} 
                      onValueChange={(value) => setEditingConfig(prev => ({ ...prev, theme: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="floating">Floating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select 
                      value={editingConfig.position} 
                      onValueChange={(value) => setEditingConfig(prev => ({ ...prev, position: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                  {/* Color Presets */}
                  <div className="space-y-2">
                    <Label>Color Preset</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          className="p-2 text-xs transition-colors border rounded-lg hover:bg-gray-50"
                          onClick={() => setEditingConfig(prev => ({
                            ...prev,
                            primary_color: preset.primary,
                            secondary_color: preset.secondary
                          }))}
                        >
                          <div 
                            className="w-full h-4 mb-1 rounded"
                            style={{ backgroundColor: preset.primary }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editingConfig.primary_color}
                          onChange={(e) => setEditingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={editingConfig.primary_color}
                          onChange={(e) => setEditingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editingConfig.secondary_color || '#EFF6FF'}
                          onChange={(e) => setEditingConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={editingConfig.secondary_color || ''}
                          onChange={(e) => setEditingConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          placeholder="#EFF6FF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Avatar Style */}
                  <div className="space-y-2">
                    <Label>Avatar Style</Label>
                    <Select 
                      value={editingConfig.avatar_style} 
                      onValueChange={(value) => setEditingConfig(prev => ({ ...prev, avatar_style: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bot">Bot</SelectItem>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ✅ Updated Avatar Icon Selection */}
                  <div className="space-y-2">
                    <Label>Avatar Icon</Label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {avatarIcons.map((avatar) => {
                        const IconComponent = avatar.icon
                        const isSelected = editingConfig.avatar_icon === avatar.name
                        
                        return (
                          <button
                            key={avatar.name}
                            className={`p-3 rounded-lg border text-center hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                            }`}
                            onClick={() => setEditingConfig(prev => ({ ...prev, avatar_icon: avatar.name }))}
                            title={avatar.name}
                          >
                            <IconComponent 
                              className="w-6 h-6 mx-auto mb-1" 
                              style={{ color: isSelected ? editingConfig.primary_color : avatar.color }}
                            />
                            <div className="text-xs font-medium truncate">{avatar.name}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4">
                  {/* Animation Style */}
                  <div className="space-y-2">
                    <Label>Animation</Label>
                    <Select 
                      value={editingConfig.animation_style} 
                      onValueChange={(value) => setEditingConfig(prev => ({ ...prev, animation_style: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bubble Style */}
                  <div className="space-y-2">
                    <Label>Bubble Style</Label>
                    <Select 
                      value={editingConfig.bubble_style} 
                      onValueChange={(value) => setEditingConfig(prev => ({ ...prev, bubble_style: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-2">
                    <Label>Border Radius: {editingConfig.border_radius}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={editingConfig.border_radius}
                      onChange={(e) => setEditingConfig(prev => ({ ...prev, border_radius: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  {/* Show Branding */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingConfig.show_branding}
                      onCheckedChange={(checked) => setEditingConfig(prev => ({ ...prev, show_branding: checked }))}
                    />
                    <Label>Show WebBot AI Branding</Label>
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={editingConfig.welcome_message}
                      onChange={(e) => setEditingConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                      placeholder="Hello! How can I help you today?"
                      rows={3}
                    />
                  </div>

                  {/* Placeholder Text */}
                  <div className="space-y-2">
                    <Label>Input Placeholder</Label>
                    <Input
                      value={editingConfig.placeholder_text || ''}
                      onChange={(e) => setEditingConfig(prev => ({ ...prev, placeholder_text: e.target.value }))}
                      placeholder="Type your message..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditingConfig(defaultConfig)
                    setEditingName(selectedChatbot?.name || '')
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
              
              <div className="border rounded-lg">
                <ChatbotPreview config={editingConfig} name={editingName} />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveConfig} 
                disabled={saving}
                className="w-full"
              >
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}