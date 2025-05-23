/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ProductionChatWidget.tsx
'use client'

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { X, MessageCircle, Send, Bot, AlertCircle } from "lucide-react";

// Utility function for class names
// const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatbotConfig {
  id: string
  name: string
  welcome_message: string
  theme: string
  position: 'bottom-right' | 'bottom-left'
  website_id: string
}

interface ProductionChatWidgetProps {
  chatbotId: string
  websiteId: string
  apiBaseUrl?: string
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID from localStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId()
  
  let sessionId = localStorage.getItem('webbot_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('webbot_session_id', sessionId)
  }
  return sessionId
}

export default function ProductionChatWidget({ 
  chatbotId, 
//   websiteId,
  apiBaseUrl = '' 
}: ProductionChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig | null>(null)
  const [sessionId] = useState(() => getSessionId())
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chatbot configuration
  useEffect(() => {
    const loadChatbotConfig = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/chatbot-config?chatbotId=${chatbotId}`)
        if (response.ok) {
          const config = await response.json()
          setChatbotConfig(config)
          
          // Add welcome message
          if (config.welcome_message && messages.length === 0) {
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: config.welcome_message,
              timestamp: new Date().toISOString()
            }])
          }
        }
      } catch (error) {
        console.error('Failed to load chatbot config:', error)
      }
    }

    loadChatbotConfig()
  }, [chatbotId, apiBaseUrl])

  // Load conversation history
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (hasLoadedHistory) return
      
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/chat?chatbotId=${chatbotId}&sessionId=${sessionId}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.conversationHistory?.length > 0) {
            // Convert API format to component format
            const formattedMessages: ChatMessage[] = data.conversationHistory
              .filter((msg: any) => msg.role !== 'system')
              .map((msg: any, index: number) => ({
                id: `history_${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
              }))
            
            // Only set if we don't already have messages (avoid overwriting welcome message)
            if (messages.length <= 1) {
              setMessages(prev => {
                const welcomeMsg = prev.find(m => m.id === 'welcome')
                return welcomeMsg 
                  ? [welcomeMsg, ...formattedMessages]
                  : formattedMessages
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error)
      } finally {
        setHasLoadedHistory(true)
      }
    }

    if (isOpen && !hasLoadedHistory) {
      loadConversationHistory()
    }
  }, [isOpen, chatbotId, sessionId, hasLoadedHistory, apiBaseUrl])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))

      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          message: messageContent.trim(),
          sessionId,
          conversationHistory
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error: any) {
      console.error('Failed to send message:', error)
      setError(error.message || 'Failed to send message. Please try again.')
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setError(null)
    
    // Focus input when opening
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const position = chatbotConfig?.position || 'bottom-right'
  const chatbotName = chatbotConfig?.name || 'AI Assistant'

  return (
    <div 
      className={`fixed z-[999999] ${
        position === 'bottom-right' ? 'bottom-5 right-5' : 'bottom-5 left-5'
      }`}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Chat Window */}
      <div
        className={`
          absolute transition-all duration-300 ease-out
          ${position === 'bottom-right' ? 'right-0 bottom-[calc(100%+10px)]' : 'left-0 bottom-[calc(100%+10px)]'}
          ${isOpen 
            ? 'opacity-100 visible translate-y-0 pointer-events-auto' 
            : 'opacity-0 invisible translate-y-2 pointer-events-none'
          }
        `}
        style={{
          width: '384px',
          height: '500px',
          maxWidth: 'calc(100vw - 20px)',
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden bg-white border border-gray-200 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white bg-blue-600 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{chatbotName}</h3>
                <p className="text-xs text-blue-100">Online now</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-700'
                }`}>
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 text-xs font-medium bg-gray-300 rounded-full">
                  AI
                </div>
                <div className="px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                style={{ maxHeight: '100px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[44px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="flex items-center justify-center text-white transition-all duration-300 bg-blue-600 rounded-full shadow-lg w-14 h-14 hover:bg-blue-700 hover:shadow-xl"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}