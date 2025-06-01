// src/components/SubscriptionAwareChatWidget.tsx - Enhanced with Persistent Sessions
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Send, X, Minimize2, Maximize2, Paperclip, Mic, MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

// Enhanced ContactForm component with returning user support
const ContactForm = React.memo(({ 
  config, 
  configError, 
  onSubmit,
  isReturningUser = false
}: {
  config: ChatbotConfig | null
  configError: string | null
  onSubmit: (data: ContactInfo) => void
  isReturningUser?: boolean
}) => {
  // Local state - completely isolated from parent
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')

  // Local handlers with no external dependencies
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.slice(0, 100)) // Simple length limit
    if (nameError) setNameError('')
  }, [nameError])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.slice(0, 100))
    if (emailError) setEmailError('')
  }, [emailError])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value.slice(0, 500))
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    let isValid = true
    if (!name.trim()) {
      setNameError('Name is required')
      isValid = false
    }
    if (!email.trim()) {
      setEmailError('Email is required')
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    }
    
    if (!isValid) return
    
    // Submit to parent
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      notes: notes.trim() || undefined
    })
  }, [name, email, notes, onSubmit])

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2" style={{ color: config?.text_color }}>
          {isReturningUser ? 'Welcome back!' : 'Welcome! Let\'s get started'}
        </h3>
        <p className="text-sm text-gray-600">
          {isReturningUser 
            ? 'Please provide your contact information to continue our conversation.'
            : 'Please provide your contact information to begin chatting with our AI assistant.'
          }
        </p>
        {configError && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Using fallback configuration: {configError}
          </div>
        )}
        {isReturningUser && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            💡 This will start a new conversation session
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name" style={{ color: config?.text_color }}>
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter your full name"
            className={nameError ? "border-red-500" : ""}
          />
          {nameError && (
            <p className="text-xs text-red-500">{nameError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contact-email" style={{ color: config?.text_color }}>
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className={emailError ? "border-red-500" : ""}
          />
          {emailError && (
            <p className="text-xs text-red-500">{emailError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contact-notes" style={{ color: config?.text_color }}>
            Notes <span className="text-gray-400">(optional)</span>
          </Label>
          <Textarea
            id="contact-notes"
            value={notes}
            onChange={handleNotesChange}
            rows={3}
            placeholder="Tell us what you'd like to discuss or ask about..."
            className="resize-none"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: config?.primary_color }}
        >
          {isReturningUser ? 'Continue Conversation' : 'Start Chatting'}
        </Button>
      </form>
    </div>
  )
})

ContactForm.displayName = 'ContactForm'

// Enhanced chat input component
const ChatInput = React.memo(({ 
  onSend, 
  placeholder, 
  disabled, 
  textColor, 
  primaryColor 
}: {
  onSend: (message: string) => void
  placeholder: string
  disabled: boolean
  textColor: string
  primaryColor: string
}) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value.slice(0, 500))
  }, [])

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }, [value, disabled, onSend])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative rounded-lg border bg-white focus-within:ring-2 focus-within:ring-opacity-50 border-gray-200">
      <Textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="border-0 rounded-lg resize-none focus:outline-none focus:ring-0 max-h-32 min-h-[48px] pr-24"
        style={{ 
          color: textColor,
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
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ 
            backgroundColor: primaryColor,
            color: 'white'
          }}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})

ChatInput.displayName = 'ChatInput'

export default function SubscriptionAwareChatWidget({ 
  chatbotId, 
  websiteId 
}: SubscriptionAwareChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showContactForm, setShowContactForm] = useState(true)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string>('')
  const [sessionLoaded, setSessionLoaded] = useState(false)
  
  // Determine API base URL more dynamically
  const API_BASE_URL = useMemo(() => {
    // Try to get from window location if we're in an iframe
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const apiUrl = params.get('apiUrl')
      if (apiUrl) return apiUrl
    }
    // Fallback to production API
    return 'https://webbot-ai.netlify.app'
  }, [])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  
  // Session storage keys
  const SESSION_STORAGE_KEY = `webbot_session_${chatbotId}_${websiteId}`
  const CONTACT_STORAGE_KEY = `webbot_contact_${chatbotId}_${websiteId}`

  // Load existing session on mount
  useEffect(() => {
    const loadExistingSession = () => {
      try {
        // Check if localStorage is available
        if (typeof window !== 'undefined' && window.localStorage) {
          const existingSession = localStorage.getItem(SESSION_STORAGE_KEY)
          const existingContact = localStorage.getItem(CONTACT_STORAGE_KEY)
          
          if (existingSession && existingContact) {
            const sessionData = JSON.parse(existingSession)
            const contactData = JSON.parse(existingContact)
            
            // Validate session data (check if it's not too old, e.g., 30 days)
            const sessionAge = Date.now() - sessionData.createdAt
            const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
            
            if (sessionAge < maxAge) {
              setSessionId(sessionData.sessionId)
              setContactInfo(contactData)
              setShowContactForm(false)
              setMessages(sessionData.messages || [])
              console.log('Loaded existing session:', sessionData.sessionId)
            } else {
              // Session too old, clear it
              localStorage.removeItem(SESSION_STORAGE_KEY)
              localStorage.removeItem(CONTACT_STORAGE_KEY)
              setSessionId(generateNewSessionId())
            }
          } else {
            // No existing session, create new one
            setSessionId(generateNewSessionId())
          }
        } else {
          // localStorage not available, create new session
          setSessionId(generateNewSessionId())
        }
      } catch (error) {
        console.error('Error loading session:', error)
        setSessionId(generateNewSessionId())
      } finally {
        setSessionLoaded(true)
      }
    }

    const generateNewSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    loadExistingSession()
  }, [chatbotId, websiteId, SESSION_STORAGE_KEY, CONTACT_STORAGE_KEY])

  // Enhanced config fetching with better error handling and retries
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3

    const fetchConfig = async (): Promise<void> => {
      try {
        setConfigLoading(true)
        setConfigError(null)
        
        console.log('Fetching chatbot config:', { chatbotId, websiteId, apiUrl: API_BASE_URL })
        
        const url = `${API_BASE_URL}/api/chatbot-config?chatbotId=${encodeURIComponent(chatbotId)}&websiteId=${encodeURIComponent(websiteId)}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'omit'
        })

        console.log('Config fetch response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          console.error('Config fetch failed:', errorData)
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`)
        }

        const data = await response.json()
        console.log('Config loaded successfully:', data)
        
        if (!data.success && !data.id) {
          throw new Error('Invalid response format')
        }

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
          avatar_icon: data.config?.avatar_icon || 'Bot',
          welcome_message: data.welcome_message || 'Hello! How can I help you today?',
          placeholder_text: data.config?.placeholder_text || 'Type your message...',
          animation_style: data.config?.animation_style || 'none',
          bubble_style: data.config?.bubble_style || 'modern',
          show_branding: data.config?.show_branding !== false
        }
        
        setConfig(chatbotConfig)
        setConfigError(null)
        
      } catch (error) {
        console.error('Failed to fetch chatbot config:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying config fetch (${retryCount}/${maxRetries})...`)
          setTimeout(() => fetchConfig(), 1000 * retryCount)
          return
        }
        
        setConfigError(`Failed to load configuration: ${errorMessage}`)
        
        // Use default config as fallback
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
          avatar_icon: 'Bot',
          welcome_message: 'Hello! How can I help you today?',
          placeholder_text: 'Type your message...',
          animation_style: 'none',
          bubble_style: 'modern',
          show_branding: true
        }
        
        setConfig(defaultConfig)
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
  }, [chatbotId, websiteId, API_BASE_URL])

  // Enhanced contact form submission handler with persistent session saving
  const handleContactSubmit = useCallback(async (contactData: ContactInfo) => {
    setContactInfo(contactData)
    setShowContactForm(false)
    
    // Save session and contact data to localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessionData = {
          sessionId,
          createdAt: Date.now(),
          chatbotId,
          websiteId,
          messages: []
        }
        
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contactData))
        console.log('Session saved to localStorage:', sessionId)
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
    }
    
    // Initialize chat with welcome message
    if (config) {
      const welcomeMessage = {
        role: 'assistant' as const,
        content: `Hello ${contactData.name}! ${config.welcome_message}`,
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }
    
    // Send contact info to Supabase Edge Function for proper database saving
    try {
      console.log('Saving contact info:', contactData)
      
      const response = await fetch(`https://dxepbnoagmdqlxeyybla.supabase.co/functions/v1/save-contact`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          chatbotId,
          sessionId,
          contactInfo: contactData,
          name: contactData.name,
          email: contactData.email,
          notes: contactData.notes
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to save contact info:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
      } else {
        const result = await response.json()
        console.log('Contact info saved successfully:', result)
      }
    } catch (error) {
      console.error('Failed to save contact info:', error)
      
      // Fallback to original API endpoint
      try {
        await fetch(`${API_BASE_URL}/api/chat/contact`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'omit',
          body: JSON.stringify({
            chatbotId,
            sessionId,
            contactInfo: contactData
          })
        })
      } catch (fallbackError) {
        console.error('Fallback contact save also failed:', fallbackError)
      }
    }
  }, [config, chatbotId, sessionId, API_BASE_URL, SESSION_STORAGE_KEY, CONTACT_STORAGE_KEY])

  // Enhanced message send handler
  const handleMessageSend = useCallback(async (message: string) => {
    if (!message.trim() || isLoading || !config || !contactInfo) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
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
  }, [isLoading, config, contactInfo, chatbotId, sessionId, messages, API_BASE_URL])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (sessionLoaded && sessionId && messages.length > 0 && contactInfo) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const sessionData = {
            sessionId,
            createdAt: Date.now(),
            chatbotId,
            websiteId,
            messages
          }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
        }
      } catch (error) {
        console.error('Failed to save messages to localStorage:', error)
      }
    }
  }, [messages, sessionLoaded, sessionId, chatbotId, websiteId, contactInfo, SESSION_STORAGE_KEY])

  // Function to end the current session
  const endSession = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SESSION_STORAGE_KEY)
        localStorage.removeItem(CONTACT_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to clear session data:', error)
    }
    
    // Reset state
    setContactInfo(null)
    setShowContactForm(true)
    setMessages([])
    setIsOpen(false)
    
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    
    console.log('Session ended, new session created:', newSessionId)
  }, [SESSION_STORAGE_KEY, CONTACT_STORAGE_KEY])

  // Function to check if user has an active session
  const hasActiveSession = useCallback(() => {
    return contactInfo !== null && !showContactForm
  }, [contactInfo, showContactForm])

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

  // Loading state
  if (configLoading || !sessionLoaded) {
    return (
      <div className="fixed bottom-5 right-5 z-[999999]">
        <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (configError && !config) {
    return (
      <div className="fixed bottom-5 right-5 z-[999999]">
        <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center" title={configError}>
          <X className="w-6 h-6 text-white" />
        </div>
      </div>
    )
  }

  const FloatingButton = () => (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className={`
          w-14 h-14 shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
          flex items-center justify-center group hover:shadow-xl
          ${animationClass}
        `}
        style={floatingButtonStyles}
        aria-label="Open chat"
        title={configError ? `⚠️ ${configError}` : (hasActiveSession() ? 'Continue conversation' : 'Start new conversation')}
      >
        {renderAvatarIcon()}
      </button>
      
      {/* Active session indicator */}
      {hasActiveSession() && (
        <div 
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config?.primary_color }}
          title="Active session"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* New message indicator (if needed) */}
      {messages.length > 1 && hasActiveSession() && (
        <div 
          className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
          title={`${messages.length - 1} messages`}
        >
          {messages.length - 1 > 9 ? '9+' : messages.length - 1}
        </div>
      )}
    </div>
  )

  const ChatWindow = () => (
    <div 
      ref={chatRef}
      className={`
        mb-4 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden backdrop-blur-sm
        ${isMinimized ? 'h-16' : 'h-[600px] w-[90vw] sm:w-[400px] md:w-[450px]'}
        ${config?.theme === 'minimal' ? 'border border-gray-200' : ''}
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
            <span className="font-semibold text-sm">{config?.name}</span>
            <p className="text-xs opacity-90">
              {configError ? '⚠️ Limited functionality' : 
               hasActiveSession() ? 'Session active' : 'Online now'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasActiveSession() && (
            <button
              onClick={endSession}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="End session"
              title="End session and start over"
            >
              <span className="text-xs">End</span>
            </button>
          )}
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
            <ContactForm 
              config={config}
              configError={configError}
              onSubmit={handleContactSubmit}
              isReturningUser={sessionLoaded && contactInfo !== null}
            />
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
                        backgroundColor: message.role === 'user' ? config?.primary_color : config?.secondary_color,
                        color: message.role === 'user' ? 'white' : config?.primary_color
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
                          ? config?.primary_color 
                          : config?.secondary_color,
                        color: message.role === 'user' 
                          ? 'white' 
                          : config?.text_color,
                        border: message.role === 'user' 
                          ? 'none' 
                          : `1px solid ${config?.primary_color}20`
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
                      style={{ backgroundColor: config?.secondary_color, color: config?.primary_color }}
                    >
                      {renderAvatarIcon('sm')}
                    </div>
                    <div 
                      className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                      style={{ backgroundColor: config?.secondary_color, border: `1px solid ${config?.primary_color}20` }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: config?.primary_color, opacity: 0.6 }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: config?.primary_color, 
                              opacity: 0.6,
                              animationDelay: '0.1s' 
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: config?.primary_color, 
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
              <div className="p-4 border-t border-gray-100" style={{ backgroundColor: config?.background_color }}>
                <ChatInput
                  onSend={handleMessageSend}
                  placeholder={config?.placeholder_text || 'Type your message...'}
                  disabled={isLoading}
                  textColor={config?.text_color || '#1F2937'}
                  primaryColor={config?.primary_color || '#3B82F6'}
                />
                
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-400">
                    Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-xs">Shift+Enter</kbd> for new line
                  </span>
                </div>
                
                {config?.show_branding && (
                  <div className="mt-2 text-center">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      Powered by{' '}
                      <a 
                        href="https://webbot.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline transition-colors"
                        style={{ color: config?.primary_color }}
                      >
                        WebBot AI
                      </a>
                      {hasActiveSession() && (
                        <span className="block mt-1">
                          Session active • <button 
                            onClick={endSession}
                            className="hover:underline text-gray-400"
                          >
                            End session
                          </button>
                        </span>
                      )}
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