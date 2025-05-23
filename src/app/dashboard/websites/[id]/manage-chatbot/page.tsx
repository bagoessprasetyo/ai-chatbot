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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// import { cn } from "@/lib/utils";
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

interface Website {
  id: string
  title: string
  url: string
  status: string
}

interface Chatbot {
  id: string
  website_id: string
  name: string
  config: any
  is_active: boolean
}

interface TestMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ManageChatbotPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [website, setWebsite] = useState<Website | null>(null)
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("configuration")

  // Configuration state
  const [botName, setBotName] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right")
  const [theme, setTheme] = useState("default")

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
          setWelcomeMessage(chatbotData.config?.welcome_message || "")
          setIsActive(chatbotData.is_active)
          setPrimaryColor(chatbotData.config?.primary_color || "#3b82f6")
          setPosition(chatbotData.config?.position || "bottom-right")
          setTheme(chatbotData.config?.theme || "default")
        } else {
          // No chatbot exists, set defaults
          setBotName(`${websiteData.title} Assistant`)
          setWelcomeMessage(`Hello! I'm here to help you with any questions about ${websiteData.title}. How can I assist you today?`)
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
        config: {
          welcome_message: welcomeMessage,
          primary_color: primaryColor,
          position: position,
          theme: theme
        },
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

      // Success feedback
      alert('Configuration saved successfully!')
      
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration: ' + error.message)
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="configuration">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="testing">
            <MessageSquare className="w-4 h-4 mr-2" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>
                Configure the basic settings for your chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bot-name">Chatbot Name</Label>
                  <Input
                    id="bot-name"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Customer Support Bot"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will appear in the chat header
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hello! How can I help you today?"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    The first message visitors will see when they open the chat
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-active">Chatbot Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable the chatbot on your website
                    </p>
                  </div>
                  <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setBotName(chatbot?.name || `${website.title} Assistant`)
                setWelcomeMessage(chatbot?.config?.welcome_message || "")
                setIsActive(chatbot?.is_active ?? true)
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSaveConfiguration} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="position">Chat Position</Label>
                  <Select value={position} onValueChange={(value: "bottom-right" | "bottom-left") => setPosition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfiguration} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Appearance
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="mt-4 space-y-4">
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
                    {testMessages.length === 0 && welcomeMessage && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-3 py-2 max-w-[75%]">
                          {welcomeMessage}
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
                        placeholder="Type your message..."
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
  )
}