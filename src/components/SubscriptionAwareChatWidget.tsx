// src/components/SubscriptionAwareChatWidget.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, X, Minimize2, Maximize2 } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatbotConfig {
  name: string
  theme: 'default' | 'minimal' | 'modern' | 'rounded' | 'floating'
  position: 'bottom-right' | 'bottom-left' | 'bottom-center'
  primary_color: string
  secondary_color: string
  text_color: string
  background_color: string
  border_radius: number
  avatar_style: 'bot' | 'circle' | 'square' | 'custom'
  avatar_icon: string
  welcome_message: string
  placeholder_text: string
  animation_style: 'none' | 'bounce' | 'pulse' | 'fade'
  bubble_style: 'modern' | 'classic' | 'minimal'
  show_branding: boolean
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
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch chatbot configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/chatbot-config?chatbotId=${chatbotId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Build complete config object with all properties
          const chatbotConfig: ChatbotConfig = {
            name: data.name || 'AI Assistant',
            theme: data.theme || 'default',
            position: data.position || 'bottom-right',
            primary_color: data.config?.primary_color || '#3B82F6',
            secondary_color: data.config?.secondary_color || '#EFF6FF',
            text_color: data.config?.text_color || '#1F2937',
            background_color: data.config?.background_color || '#FFFFFF',
            border_radius: data.config?.border_radius || 12,
            avatar_style: data.config?.avatar_style || 'bot',
            avatar_icon: data.config?.avatar_icon || '🤖',
            welcome_message: data.welcome_message || 'Hello! How can I help you today?',
            placeholder_text: data.config?.placeholder_text || 'Type your message...',
            animation_style: data.config?.animation_style || 'none',
            bubble_style: data.config?.bubble_style || 'modern',
            show_branding: data.config?.show_branding !== false
          }
          
          setConfig(chatbotConfig)
          
          // Add welcome message
          setMessages([{
            role: 'assistant',
            content: chatbotConfig.welcome_message,
            timestamp: new Date().toISOString()
          }])
        } else {
          console.error('Failed to fetch chatbot config:', response.status)
          useDefaultConfig()
        }
      } catch (error) {
        console.error('Failed to fetch chatbot config:', error)
        useDefaultConfig()
      }
    }

    const useDefaultConfig = () => {
      const defaultConfig: ChatbotConfig = {
        name: 'AI Assistant',
        theme: 'default',
        position: 'bottom-right',
        primary_color: '#3B82F6',
        secondary_color: '#EFF6FF',
        text_color: '#1F2937',
        background_color: '#FFFFFF',
        border_radius: 12,
        avatar_style: 'bot',
        avatar_icon: '🤖',
        welcome_message: 'Hello! How can I help you today?',
        placeholder_text: 'Type your message...',
        animation_style: 'none',
        bubble_style: 'modern',
        show_branding: true
      }
      
      setConfig(defaultConfig)
      setMessages([{
        role: 'assistant',
        content: defaultConfig.welcome_message,
        timestamp: new Date().toISOString()
      }])
    }

    fetchConfig()
  }, [chatbotId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !config) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          message: userMessage.content,
          sessionId,
          conversationHistory: messages
        })
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Handle different error types with styled error messages
        let errorContent = "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
        
        if (data.type === 'limit_exceeded') {
          errorContent = "I'm sorry, but the monthly conversation limit has been reached. Please contact the website owner to upgrade their plan for continued service."
        } else if (data.type === 'trial_expired') {
          errorContent = "I'm sorry, but the free trial has expired. Please contact the website owner to activate their subscription."
        } else if (data.type === 'subscription_inactive') {
          errorContent = "I'm sorry, but the subscription is not active. Please contact the website owner to update their payment method."
        }

        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!config) {
    return (
      <div className="fixed bottom-5 right-5 z-[999999]">
        <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  // Position styles
  const getPositionStyles = () => {
    const base = 'fixed z-[999999]'
    switch (config.position) {
      case 'bottom-left':
        return `${base} bottom-5 left-5`
      case 'bottom-center':
        return `${base} bottom-5 left-1/2 transform -translate-x-1/2`
      case 'bottom-right':
      default:
        return `${base} bottom-5 right-5`
    }
  }

  // Avatar styles
  const getAvatarStyle = () => {
    const baseSize = 'w-8 h-8 flex items-center justify-center text-white'
    switch (config.avatar_style) {
      case 'square':
        return `${baseSize} rounded-lg`
      case 'circle':
        return `${baseSize} rounded-full`
      default:
        return `${baseSize} rounded-xl`
    }
  }

  // Animation classes
  const getAnimationClass = () => {
    switch (config.animation_style) {
      case 'bounce':
        return 'animate-bounce'
      case 'pulse':
        return 'animate-pulse'
      case 'fade':
        return 'animate-pulse'
      default:
        return ''
    }
  }

  // Bubble styles with proper styling
  const getBubbleStyle = (isUser: boolean) => {
    const baseStyle = 'max-w-[75%] px-4 py-2 text-sm break-words'
    
    if (isUser) {
      return `${baseStyle} rounded-t-2xl rounded-bl-2xl rounded-br-sm text-white`
    }

    switch (config.bubble_style) {
      case 'classic':
        return `${baseStyle} rounded-2xl border`
      case 'minimal':
        return `${baseStyle} rounded-lg border`
      case 'modern':
      default:
        return `${baseStyle} rounded-t-2xl rounded-br-2xl rounded-bl-sm`
    }
  }

  const FloatingButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      className={`
        w-14 h-14 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
        flex items-center justify-center
        ${getAnimationClass()}
      `}
      style={{ 
        backgroundColor: config.primary_color,
        borderRadius: config.avatar_style === 'square' ? '12px' : 
                     config.avatar_style === 'circle' ? '50%' : '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
      aria-label="Open chat"
    >
      <span className="text-2xl">{config.avatar_icon}</span>
    </button>
  )

  const ChatWindow = () => (
    <div 
      className={`
        bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden
        ${isMinimized ? 'h-16' : 'h-96 w-80'}
        ${config.theme === 'minimal' ? 'border border-gray-200' : ''}
      `}
      style={{ 
        backgroundColor: config.background_color,
        borderRadius: `${config.border_radius}px`,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-white/20"
        style={{ 
          backgroundColor: config.primary_color,
          color: 'white',
          borderTopLeftRadius: `${config.border_radius}px`,
          borderTopRightRadius: `${config.border_radius}px`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className={getAvatarStyle()}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <span className="text-lg text-white">
              {config.avatar_icon}
            </span>
          </div>
          <span className="font-medium text-sm">{config.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto h-64 space-y-4 bg-gradient-to-b from-gray-50/30 to-transparent">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={getBubbleStyle(message.role === 'user')}
                  style={{
                    backgroundColor: message.role === 'user' 
                      ? config.primary_color 
                      : config.secondary_color,
                    color: message.role === 'user' 
                      ? 'white' 
                      : config.text_color,
                    borderColor: message.role === 'user' 
                      ? config.primary_color 
                      : '#E5E7EB',
                    boxShadow: message.role === 'user' 
                      ? 'none' 
                      : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={getBubbleStyle(false)}
                  style={{
                    backgroundColor: config.secondary_color,
                    color: config.text_color,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: config.primary_color, opacity: 0.6 }}
                    ></div>
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: config.primary_color, 
                        opacity: 0.6,
                        animationDelay: '0.1s' 
                      }}
                    ></div>
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: config.primary_color, 
                        opacity: 0.6,
                        animationDelay: '0.2s' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100" style={{ backgroundColor: config.background_color }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={config.placeholder_text}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                style={{ 
                  borderColor: '#E5E7EB',
                  color: config.text_color,
                  backgroundColor: 'white',
                  borderRadius: `${Math.min(config.border_radius, 8)}px`
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: config.primary_color,
                  borderRadius: `${Math.min(config.border_radius, 8)}px`
                }}
                aria-label="Send message"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
            
            {config.show_branding && (
              <div className="mt-2 text-center">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  Powered by{' '}
                  <a 
                    href="https://webbot.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline transition-colors"
                    style={{ color: config.primary_color }}
                  >
                    WebBot AI
                  </a>
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={getPositionStyles()}>
      {isOpen ? <ChatWindow /> : <FloatingButton />}
    </div>
  )
}