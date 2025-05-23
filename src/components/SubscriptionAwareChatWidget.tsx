'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Bot, 
  Send, 
  X, 
  MessageCircle, 
  AlertTriangle, 
  Zap,
  ExternalLink
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatConfig {
  id: string
  name: string
  welcome_message: string
  theme: string
  position: 'bottom-right' | 'bottom-left'
  website_id: string
  website_title: string
  website_url: string
}

interface SubscriptionInfo {
  plan_id: string
  status: string
  trial_end?: string
}

interface UsageInfo {
  used: number
  limit: number
  remaining: number
}

interface SubscriptionAwareChatWidgetProps {
  chatbotId: string
  websiteId: string
}

export default function SubscriptionAwareChatWidget({ 
  chatbotId, 
  websiteId 
}: SubscriptionAwareChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chatbot configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/chatbot-config?chatbotId=${chatbotId}`)
        const data = await response.json()
        
        if (response.ok) {
          setConfig(data)
        } else {
          setError('Failed to load chatbot configuration')
        }
      } catch (err) {
        console.error('Error loading config:', err)
        setError('Failed to initialize chatbot')
      }
    }

    if (chatbotId) {
      loadConfig()
    }
  }, [chatbotId])

  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      if (!config) return

      try {
        const response = await fetch(`/api/chat?chatbotId=${chatbotId}&sessionId=${sessionId}`)
        const data = await response.json()
        
        if (response.ok && data.conversationHistory) {
          setMessages(data.conversationHistory)
        }
      } catch (err) {
        console.error('Error loading conversation history:', err)
      }
    }

    loadHistory()
  }, [config, chatbotId, sessionId])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !config) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          message: userMessage.content,
          sessionId,
          conversationHistory: messages
        })
      })

      const data = await response.json()

      if (response.ok) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, aiMessage])
        
        // Update usage information
        if (data.usage) {
          setUsage(data.usage)
        }
        
        if (data.subscription) {
          setSubscriptionInfo(data.subscription)
        }

        // Check if approaching limit
        if (data.usage && data.usage.remaining <= 5) {
          setError(`Only ${data.usage.remaining} conversations remaining this month`)
        }

      } else {
        // Handle different error types
        if (data.type === 'limit_exceeded') {
          setLimitReached(true)
          setUsage(data.usage)
          setError('Monthly conversation limit reached. Upgrade your plan to continue.')
        } else if (data.type === 'trial_expired') {
          setLimitReached(true)
          setError('Free trial has expired. Upgrade to continue using the service.')
        } else if (data.type === 'subscription_inactive') {
          setLimitReached(true)
          setError('Subscription is not active. Please update your payment method.')
        } else {
          setError(data.error || 'Failed to send message')
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleUpgrade = () => {
    // Open upgrade page in new tab
    window.open('/dashboard/settings/billing', '_blank')
  }

  if (!config) {
    return null
  }

  return (
    <div className={`fixed z-50 ${config.position === 'bottom-right' ? 'bottom-5 right-5' : 'bottom-5 left-5'}`}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="transition-all duration-200 bg-blue-600 rounded-full shadow-lg w-14 h-14 hover:shadow-xl hover:bg-blue-700"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-96 h-[500px] shadow-2xl border-0 flex flex-col">
          {/* Header */}
          <CardHeader className="p-4 text-white bg-blue-600 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-white bg-blue-500">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  {subscriptionInfo?.status === 'trialing' && (
                    <Badge variant="secondary" className="text-xs text-orange-800 bg-orange-100">
                      Trial
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Welcome Message */}
            {messages.length === 0 && config.welcome_message && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
                  <p className="text-sm">{config.welcome_message}</p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback>
                    {message.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="px-3 py-2 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p>{error}</p>
                    {limitReached && (
                      <div className="mt-2 space-y-2">
                        {usage && (
                          <p className="text-xs">
                            {usage.used} / {usage.limit} conversations used this month
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpgrade} className="text-xs h-7">
                            <Zap className="w-3 h-3 mr-1" />
                            Upgrade Plan
                          </Button>
                          <Button variant="outline" size="sm" asChild className="text-xs h-7">
                            <a href={config.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Visit Site
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            {/* Usage Warning */}
            {usage && usage.remaining <= 10 && usage.remaining > 0 && !limitReached && (
              <div className="p-2 mb-3 text-xs text-orange-800 border border-orange-200 rounded bg-orange-50">
                <div className="flex items-center justify-between">
                  <span>{usage.remaining} conversations remaining</span>
                  <Button size="sm" variant="ghost" onClick={handleUpgrade} className="h-6 text-xs">
                    Upgrade
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={limitReached ? "Upgrade to continue..." : "Type your message..."}
                className="flex-1"
                disabled={isLoading || limitReached}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isLoading || limitReached}
                className="px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  )
}