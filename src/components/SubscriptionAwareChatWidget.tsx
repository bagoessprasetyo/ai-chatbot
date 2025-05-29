// src/components/SubscriptionAwareChatWidget.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Send, X, Minimize2, Maximize2, Paperclip, Mic, MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
// Import all the icons used in the dashboard
import { 
  Bot, 
  Headphones, 
  User, 
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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ContactInfo {
  name: string
  email: string
  notes?: string
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

// Avatar icons mapping - same as in dashboard
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

export default function SubscriptionAwareChatWidget({ 
  chatbotId, 
  websiteId 
}: SubscriptionAwareChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showContactForm, setShowContactForm] = useState(true)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Contact form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: ''
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Contact form validation and submission
  const validateForm = useCallback(() => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const contact: ContactInfo = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim() || undefined
    }
    
    setContactInfo(contact)
    setShowContactForm(false)
    
    // Initialize chat with welcome message
    if (config) {
      setMessages([{
        role: 'assistant',
        content: `Hello ${contact.name}! ${config.welcome_message}`,
        timestamp: new Date().toISOString()
      }])
    }
    
    // Send contact info to API
    try {
      await fetch('/api/chat/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          sessionId,
          contactInfo: contact
        })
      })
    } catch (error) {
      console.error('Failed to save contact info:', error)
    }
  }, [formData, validateForm, config, chatbotId, sessionId])

  const handleFormChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [formErrors])
  const renderAvatarIcon = useCallback((size: 'sm' | 'md' = 'md') => {
    if (!config) return null

    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
    const selectedIcon = avatarIcons.find(icon => icon.name === config.avatar_icon)
    
    if (selectedIcon) {
      const IconComponent = selectedIcon.icon
      return <IconComponent className={`${sizeClass} text-white`} />
    }
    
    return <span className={`${size === 'sm' ? 'text-sm' : 'text-lg'} text-white`}>{config.avatar_icon}</span>
  }, [config])

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

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Fetch chatbot configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/chatbot-config?chatbotId=${chatbotId}`)
        if (response.ok) {
          const data = await response.json()
          
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
          
          // Don't add welcome message here - will be added after contact form
        } else {
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
    }

    fetchConfig()
  }, [chatbotId])

  // Custom Markdown Components - memoized to prevent re-renders
  const MarkdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="!mt-2 !mb-2 !rounded-lg !text-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code 
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" 
          {...props}
        >
          {children}
        </code>
      )
    },
    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-sm">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 mb-2">
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
  }), [])

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !config || !contactInfo) return

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
          contactInfo,
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
  }, [inputValue, isLoading, config, contactInfo, chatbotId, sessionId, messages])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Memoized style objects to prevent re-renders
  const positionStyles = useMemo(() => {
    if (!config) return ''
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
  }, [config])

  const animationClass = useMemo(() => {
    if (!config) return ''
    switch (config.animation_style) {
      case 'bounce':
        return 'animate-bounce'
      case 'pulse':
        return 'animate-pulse'
      default:
        return ''
    }
  }, [config])

  const floatingButtonStyles = useMemo(() => {
    if (!config) return {}
    return {
      backgroundColor: config.primary_color,
      borderRadius: config.avatar_style === 'square' ? '12px' : 
                   config.avatar_style === 'circle' ? '50%' : '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
    }
  }, [config])

  const chatWindowStyles = useMemo(() => {
    if (!config) return {}
    return {
      backgroundColor: config.background_color,
      borderRadius: `${config.border_radius}px`,
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }
  }, [config])

  const headerStyles = useMemo(() => {
    if (!config) return {}
    return {
      background: `linear-gradient(135deg, ${config.primary_color}, ${config.primary_color}dd)`,
      color: 'white',
      borderTopLeftRadius: `${config.border_radius}px`,
      borderTopRightRadius: `${config.border_radius}px`
    }
  }, [config])

  if (!config) {
    return (
      <div className="fixed bottom-5 right-5 z-[999999]">
        <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  const ContactForm = () => (
    <div className="p-6 space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2" style={{ color: config.text_color }}>
          Welcome! Let's get started
        </h3>
        <p className="text-sm text-gray-600">
          Please provide your contact information to begin chatting with our AI assistant.
        </p>
      </div>
      
      <form onSubmit={handleContactSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: config.text_color }}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ 
              borderColor: formErrors.name ? '#EF4444' : '#E5E7EB',
              // '--tw-ring-color': config.primary_color 
            }}
            placeholder="Enter your full name"
          />
          {formErrors.name && (
            <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: config.text_color }}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ 
              borderColor: formErrors.email ? '#EF4444' : '#E5E7EB',
              // '--tw-ring-color': config.primary_color 
            }}
            placeholder="Enter your email address"
          />
          {formErrors.email && (
            <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: config.text_color }}>
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
            style={{ 
              borderColor: '#E5E7EB',
              // '--tw-ring-color': config.primary_color
            }}
            placeholder="Tell us what you'd like to discuss or ask about..."
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: config.primary_color }}
        >
          Start Chatting
        </button>
      </form>
    </div>
  )

  const FloatingButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      className={`
        w-14 h-14 shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
        flex items-center justify-center group hover:shadow-xl
        ${animationClass}
      `}
      style={floatingButtonStyles}
      aria-label="Open chat"
    >
      {renderAvatarIcon()}
    </button>
  )

  const ChatWindow = () => (
    <div 
      ref={chatRef}
      className={`
        mb-4 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden backdrop-blur-sm
        ${isMinimized ? 'h-16' : 'h-[500px] w-[90vw] sm:w-[400px] md:w-[450px]'}
        ${config.theme === 'minimal' ? 'border border-gray-200' : ''}
      `}
      style={chatWindowStyles}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 backdrop-blur-sm"
        style={headerStyles}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            {renderAvatarIcon('sm')}
          </div>
          <div>
            <span className="font-semibold text-sm">{config.name}</span>
            <p className="text-xs opacity-90">Online now</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {showContactForm ? (
            <ContactForm />
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-80 space-y-4 bg-gradient-to-b from-gray-50/30 to-transparent scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-300 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: message.role === 'user' ? config.primary_color : config.secondary_color,
                        color: message.role === 'user' ? 'white' : config.primary_color
                      }}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        renderAvatarIcon('sm')
                      )}
                    </div>
                    
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm shadow-sm ${
                        message.role === 'user' 
                          ? 'rounded-br-md' 
                          : 'rounded-bl-md'
                      }`}
                      style={{
                        backgroundColor: message.role === 'user' 
                          ? config.primary_color 
                          : config.secondary_color,
                        color: message.role === 'user' 
                          ? 'white' 
                          : config.text_color,
                        border: message.role === 'user' 
                          ? 'none' 
                          : `1px solid ${config.primary_color}20`
                      }}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none text-inherit">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div className="text-[10px] opacity-60 mt-2 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: config.secondary_color, color: config.primary_color }}
                    >
                      {renderAvatarIcon('sm')}
                    </div>
                    <div 
                      className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                      style={{ backgroundColor: config.secondary_color, border: `1px solid ${config.primary_color}20` }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
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
                        <span className="text-xs text-gray-500">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100" style={{ backgroundColor: config.background_color }}>
                <div className="relative rounded-lg border bg-white focus-within:ring-2 focus-within:ring-opacity-50" 
                     style={{ borderColor: '#E5E7EB', ['--tw-ring-color' as string]: config.primary_color }}>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={config.placeholder_text}
                    disabled={isLoading}
                    rows={1}
                    className="w-full px-4 py-3 pr-24 text-sm border-0 rounded-lg resize-none focus:outline-none max-h-32 min-h-[48px]"
                    style={{ 
                      color: config.text_color,
                      backgroundColor: 'white'
                    }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Attach file"
                    >
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Voice input"
                    >
                      <Mic className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ 
                        backgroundColor: config.primary_color,
                        color: 'white'
                      }}
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-400">
                    Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-xs">Shift+Enter</kbd> for new line
                  </span>
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
        </>
      )}
    </div>
  )

  return (
    <div className={positionStyles}>
      {isOpen ? <ChatWindow /> : <FloatingButton />}
    </div>
  )
}