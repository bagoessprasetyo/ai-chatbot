/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/websites/[id]/manage-chatbot/page.tsx
'use client'

import React, { useState, FormEvent, useEffect } from "react";
import {
  Bot,
  Send,
  Settings,
  Palette,
  MessageSquare,
  Save,
  RefreshCw,
  X,
  ArrowLeft,
  AlertCircle,
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
  Gamepad2,
  Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { toast } from 'sonner';

interface Website {
  id: string
  title: string
  url: string
  status: string
}

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
  website_id: string
  name: string
  config: ChatbotConfig
  is_active: boolean
}

interface TestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Default configuration
const defaultConfig: ChatbotConfig = {
  theme: 'default',
  position: 'bottom-right',
  primary_color: '#3B82F6',
  secondary_color: '#EFF6FF',
  text_color: '#1F2937',
  background_color: '#FFFFFF',
  border_radius: 12,
  avatar_style: 'bot',
  avatar_icon: 'Bot',
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

// Modern flat avatar icons
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

export default function ManageChatbotPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [website, setWebsite] = useState<Website | null>(null)
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Configuration state
  const [botName, setBotName] = useState("")
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig)
  const [isActive, setIsActive] = useState(true)

  // Testing state
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [testInput, setTestInput] = useState("")
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !params.id) return

      try {
        const supabase = createClient()
        
        // Fetch website
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('id, title, url, status')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (websiteError) throw websiteError
        setWebsite(websiteData)

        // Fetch chatbot
        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('*')
          .eq('website_id', params.id)
          .maybeSingle()

        if (chatbotError && chatbotError.code !== 'PGRST116') {
          throw chatbotError
        }

        if (chatbotData) {
          setChatbot(chatbotData)
          setBotName(chatbotData.name)
          setIsActive(chatbotData.is_active)
          
          // Merge saved config with defaults
          const mergedConfig = { 
            ...defaultConfig, 
            ...chatbotData.config,
            welcome_message: chatbotData.config?.welcome_message || `Hello! I'm here to help you with any questions about ${websiteData.title}. How can I assist you today?`
          }
          setConfig(mergedConfig)
        } else {
          // No chatbot exists, set defaults
          setBotName(`${websiteData.title} Assistant`)
          setConfig({
            ...defaultConfig,
            welcome_message: `Hello! I'm here to help you with any questions about ${websiteData.title}. How can I assist you today?`
          })
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/dashboard/websites')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, router])

  const handleSaveConfiguration = async () => {
    if (!website || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const configData = {
        website_id: website.id,
        name: botName,
        config: config,
        is_active: isActive
      }

      if (chatbot) {
        // Update existing chatbot
        const { error } = await supabase
          .from('chatbots')
          .update(configData)
          .eq('id', chatbot.id)

        if (error) throw error
      } else {
        // Create new chatbot
        const { data, error } = await supabase
          .from('chatbots')
          .insert(configData)
          .select()
          .single()

        if (error) throw error
        setChatbot(data)
      }

      toast.success('Configuration saved successfully!')
      
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      toast.error('Failed to save configuration: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTestMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!testInput.trim() || !chatbot) return

    const userMessage: TestMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: testInput.trim(),
      timestamp: new Date().toISOString()
    }

    setTestMessages(prev => [...prev, userMessage])
    setTestInput("")
    setTestLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          message: userMessage.content,
          sessionId: `test_${Date.now()}`,
          conversationHistory: testMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      const data = await response.json()

      if (response.ok) {
        const aiMessage: TestMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }
        setTestMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }

    } catch (error: any) {
      console.error('Test message error:', error)
      const errorMessage: TestMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      }
      setTestMessages(prev => [...prev, errorMessage])
    } finally {
      setTestLoading(false)
    }
  }

  const clearTestHistory = () => {
    setTestMessages([])
  }

  // Preview Component
  const ChatbotPreview = () => {
    const selectedIcon = avatarIcons.find(icon => icon.name === config.avatar_icon) || avatarIcons[0]
    const IconComponent = selectedIcon.icon

    return (
      <div className="relative h-48 p-4 overflow-hidden border rounded-lg bg-gray-50">
        <div className="mb-2 text-sm font-medium text-gray-600">
          {botName}
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
          <h1 className="text-3xl font-bold">Manage Chatbot</h1>
          <p className="text-muted-foreground">
            Configure and customize your AI assistant for {website.title}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="general">
                <Settings className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="behavior">
                Behavior
              </TabsTrigger>
              <TabsTrigger value="messages">
                Messages
              </TabsTrigger>
              <TabsTrigger value="testing">
                <MessageSquare className="w-4 h-4 mr-2" />
                Testing
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure the basic settings for your chatbot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chatbot Name</Label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Enter chatbot name"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name is used for internal organization and may be displayed to users.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select 
                      value={config.theme} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, theme: value as any }))}
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
                      value={config.position} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, position: value as any }))}
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

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Chatbot Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the chatbot on your website
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of your chatbot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Presets */}
                  <div className="space-y-2">
                    <Label>Color Preset</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          className="p-2 text-xs transition-colors border rounded-lg hover:bg-gray-50"
                          onClick={() => setConfig(prev => ({
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
                          value={config.primary_color}
                          onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={config.primary_color}
                          onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.secondary_color || '#EFF6FF'}
                          onChange={(e) => setConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={config.secondary_color || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          placeholder="#EFF6FF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Avatar Style */}
                  <div className="space-y-2">
                    <Label>Avatar Style</Label>
                    <Select 
                      value={config.avatar_style} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, avatar_style: value as any }))}
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

                  {/* Avatar Icon Selection */}
                  <div className="space-y-2">
                    <Label>Avatar Icon</Label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {avatarIcons.map((avatar) => {
                        const IconComponent = avatar.icon
                        const isSelected = config.avatar_icon === avatar.name
                        
                        return (
                          <button
                            key={avatar.name}
                            className={`p-3 rounded-lg border text-center hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                            }`}
                            onClick={() => setConfig(prev => ({ ...prev, avatar_icon: avatar.name }))}
                            title={avatar.name}
                          >
                            <IconComponent 
                              className="w-6 h-6 mx-auto mb-1" 
                              style={{ color: isSelected ? config.primary_color : avatar.color }}
                            />
                            <div className="text-xs font-medium truncate">{avatar.name}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Settings</CardTitle>
                  <CardDescription>
                    Configure how your chatbot behaves and appears.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Animation Style */}
                  <div className="space-y-2">
                    <Label>Animation</Label>
                    <Select 
                      value={config.animation_style} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, animation_style: value as any }))}
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
                      value={config.bubble_style} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, bubble_style: value as any }))}
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
                    <Label>Border Radius: {config.border_radius}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={config.border_radius}
                      onChange={(e) => setConfig(prev => ({ ...prev, border_radius: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  {/* Show Branding */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.show_branding}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, show_branding: checked }))}
                    />
                    <Label>Show WebBot AI Branding</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Message Settings</CardTitle>
                  <CardDescription>
                    Customize the messages your chatbot displays.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={config.welcome_message}
                      onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                      placeholder="Hello! How can I help you today?"
                      rows={3}
                    />
                  </div>

                  {/* Placeholder Text */}
                  <div className="space-y-2">
                    <Label>Input Placeholder</Label>
                    <Input
                      value={config.placeholder_text || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, placeholder_text: e.target.value }))}
                      placeholder="Type your message..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="mt-4">
              {!chatbot ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium">No Chatbot Configured</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      You need to save your configuration first before testing
                    </p>
                    <Button onClick={handleSaveConfiguration} disabled={saving}>
                      Save Configuration First
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Test Your Chatbot</CardTitle>
                        <CardDescription>
                          Interact with your chatbot to test its responses.
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={clearTestHistory}>
                        Clear History
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-hidden">
                    <div className="flex flex-col h-full border rounded-md">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{botName}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Messages */}
                      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                        {/* Welcome message */}
                        {testMessages.length === 0 && config.welcome_message && (
                          <div className="flex gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg px-3 py-2 max-w-[75%]">
                              {config.welcome_message}
                            </div>
                          </div>
                        )}

                        {/* Chat messages */}
                        {testMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback>
                                {message.role === 'user' ? 'You' : 'AI'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`rounded-lg px-3 py-2 max-w-[75%] ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : message.content.startsWith('Error:')
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        ))}

                        {/* Loading indicator */}
                        {testLoading && (
                          <div className="flex gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="px-3 py-2 rounded-lg bg-muted">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Input */}
                      <div className="p-3 border-t">
                        <form onSubmit={handleTestMessage} className="flex gap-2">
                          <Input
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            placeholder={config.placeholder_text || "Type your message..."}
                            className="flex-grow"
                            disabled={testLoading}
                          />
                          <Button type="submit" size="icon" disabled={!testInput.trim() || testLoading}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview and Save Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preview
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setConfig(defaultConfig)
                    setBotName(website ? `${website.title} Assistant` : 'Assistant')
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatbotPreview />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleSaveConfiguration} 
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}