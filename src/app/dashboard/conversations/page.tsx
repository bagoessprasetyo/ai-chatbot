// src/app/dashboard/conversations/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Mail,
  Clock,
  MessageSquare,
  Bot,
  ChevronRight,
  FileText,
  StickyNote
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

interface ContactInfo {
  name: string
  email: string
  notes?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  session_id: string
  chatbot_id: string
  chatbot_name: string
  website_title: string
  contact_info: ContactInfo
  messages: Message[]
  created_at: string
  updated_at: string
  message_count: number
  status: 'active' | 'completed' | 'abandoned'
}

interface ConversationFilters {
  chatbotId?: string
  dateRange?: string
  status?: string
  search?: string
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [showConversationDialog, setShowConversationDialog] = useState(false)
  const [chatbots, setChatbots] = useState<any[]>([])
  const [filters, setFilters] = useState<ConversationFilters>({})

  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchChatbots()
    }
  }, [user])

  useEffect(() => {
    filterConversations()
  }, [conversations, filters])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          chatbot_id,
          contact_info,
          messages,
          created_at,
          updated_at,
          chatbots!inner (
            id,
            name,
            websites!inner (
              user_id,
              title
            )
          )
        `)
        .eq('chatbots.websites.user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const formattedConversations: Conversation[] = conversationsData?.map(conv => ({
        id: conv.id,
        session_id: conv.session_id,
        chatbot_id: conv.chatbot_id,
        chatbot_name: conv.chatbots[0]?.name || 'Unknown Chatbot',
        website_title: conv.chatbots[0]?.websites[0]?.title || 'Unknown Website',
        contact_info: conv.contact_info || { name: 'Anonymous', email: '' },
        messages: conv.messages || [],
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: (conv.messages || []).length,
        status: determineConversationStatus(conv.messages || [])
      })) || []

      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchChatbots = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chatbots')
        .select(`
          id,
          name,
          websites!inner (
            user_id
          )
        `)
        .eq('websites.user_id', user?.id)

      if (error) throw error
      setChatbots(data || [])
    } catch (error) {
      console.error('Error fetching chatbots:', error)
    }
  }

  const determineConversationStatus = (messages: Message[]): 'active' | 'completed' | 'abandoned' => {
    if (messages.length === 0) return 'abandoned'
    if (messages.length === 1) return 'abandoned'
    
    const lastMessage = messages[messages.length - 1]
    const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime()
    const hoursAgo = timeSinceLastMessage / (1000 * 60 * 60)
    
    if (hoursAgo > 24) return 'completed'
    if (lastMessage.role === 'assistant') return 'completed'
    return 'active'
  }

  const filterConversations = () => {
    let filtered = [...conversations]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.contact_info.name.toLowerCase().includes(searchLower) ||
        conv.contact_info.email.toLowerCase().includes(searchLower) ||
        conv.chatbot_name.toLowerCase().includes(searchLower) ||
        conv.website_title.toLowerCase().includes(searchLower)
      )
    }

    if (filters.chatbotId) {
      filtered = filtered.filter(conv => conv.chatbot_id === filters.chatbotId)
    }

    if (filters.status) {
      filtered = filtered.filter(conv => conv.status === filters.status)
    }

    if (filters.dateRange) {
      const now = new Date()
      let startDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter(conv => 
        new Date(conv.created_at) >= startDate
      )
    }

    setFilteredConversations(filtered)
  }

  const exportConversations = async () => {
    try {
      const csvContent = [
        ['Date', 'Chatbot', 'Name', 'Email', 'Messages', 'Status', 'Notes'].join(','),
        ...filteredConversations.map(conv => [
          new Date(conv.created_at).toLocaleDateString(),
          conv.chatbot_name,
          conv.contact_info.name,
          conv.contact_info.email,
          conv.message_count,
          conv.status,
          conv.contact_info.notes || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Conversations exported successfully')
    } catch (error) {
      toast.error('Failed to export conversations')
    }
  }

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowConversationDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'abandoned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-64 h-10" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground">
            View and manage chatbot conversations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportConversations} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.chatbotId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, chatbotId: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Chatbots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chatbots</SelectItem>
                {chatbots.map(bot => (
                  <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{filteredConversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {filteredConversations.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {filteredConversations.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Abandoned</p>
                <p className="text-2xl font-bold">
                  {filteredConversations.filter(c => c.status === 'abandoned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.chatbotId || filters.status || filters.dateRange
                  ? 'Try adjusting your filters'
                  : 'Conversations will appear here when users start chatting with your chatbots'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewConversation(conversation)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{conversation.contact_info.name}</h3>
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{conversation.contact_info.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          <span>{conversation.chatbot_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{conversation.message_count} messages</span>
                        </div>
                      </div>
                      
                      {conversation.contact_info.notes && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <StickyNote className="w-3 h-3" />
                          <span className="truncate">{conversation.contact_info.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(conversation.updated_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversation with {selectedConversation?.contact_info.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="flex flex-col h-[60vh]">
              {/* Contact Info */}
              <div className="border-b p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedConversation.contact_info.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedConversation.contact_info.email}
                  </div>
                  <div>
                    <span className="font-medium">Chatbot:</span> {selectedConversation.chatbot_name}
                  </div>
                  <div>
                    <span className="font-medium">Started:</span> {new Date(selectedConversation.created_at).toLocaleString()}
                  </div>
                  {selectedConversation.contact_info.notes && (
                    <div className="col-span-2">
                      <span className="font-medium">Notes:</span> {selectedConversation.contact_info.notes}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown components={{
                          div: ({children}) => <div className="prose prose-sm max-w-none">{children}</div>
                        }}>
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}