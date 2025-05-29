// src/components/WebsiteStatusCard.tsx - NEW COMPONENT
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ExternalLink,
  Settings,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface Website {
  id: string
  url: string
  title: string | null
  description: string | null
  status: 'pending' | 'scraping' | 'processing' | 'ready' | 'error'
  created_at: string
  updated_at: string
  scraped_content?: any
}

interface WebsiteStatusCardProps {
  website: Website
  onRetryScaping?: (websiteId: string) => void
  onDelete?: (websiteId: string) => void
}

export function WebsiteStatusCard({ website, onRetryScaping, onDelete }: WebsiteStatusCardProps) {
  const [realTimeStatus, setRealTimeStatus] = useState(website.status)
  const [progress, setProgress] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState('')

  // Calculate time elapsed since creation
  useEffect(() => {
    const updateTimeElapsed = () => {
      const created = new Date(website.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) {
        setTimeElapsed('Just now')
      } else if (diffMins < 60) {
        setTimeElapsed(`${diffMins}m ago`)
      } else {
        const diffHours = Math.floor(diffMins / 60)
        setTimeElapsed(`${diffHours}h ago`)
      }
    }

    updateTimeElapsed()
    const interval = setInterval(updateTimeElapsed, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [website.created_at])

  // Set progress based on status
  useEffect(() => {
    switch (realTimeStatus) {
      case 'pending':
        setProgress(10)
        break
      case 'scraping':
        setProgress(50)
        break
      case 'processing':
        setProgress(80)
        break
      case 'ready':
        setProgress(100)
        break
      case 'error':
        setProgress(0)
        break
      default:
        setProgress(0)
    }
  }, [realTimeStatus])

  // Real-time status updates via Supabase realtime
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`website-${website.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'websites',
          filter: `id=eq.${website.id}`
        },
        (payload) => {
          console.log('Real-time website update:', payload)
          setRealTimeStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [website.id])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          label: 'Queued',
          description: 'Waiting to start analysis'
        }
      case 'scraping':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: RefreshCw,
          label: 'Analyzing',
          description: 'Extracting content from website'
        }
      case 'processing':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Bot,
          label: 'Setting up AI',
          description: 'Creating your chatbot'
        }
      case 'ready':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: 'Ready',
          description: 'Chatbot is live and ready'
        }
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          label: 'Failed',
          description: 'Setup failed, retry needed'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          label: 'Unknown',
          description: 'Status unknown'
        }
    }
  }

  const statusConfig = getStatusConfig(realTimeStatus)
  const StatusIcon = statusConfig.icon

  const isProcessing = ['pending', 'scraping', 'processing'].includes(realTimeStatus)

  return (
    <Card className={`transition-all duration-200 ${
      realTimeStatus === 'ready' ? 'border-green-200 bg-green-50/30' : 
      realTimeStatus === 'error' ? 'border-red-200 bg-red-50/30' : 
      'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-full bg-blue-100">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate w-full max-w-[205px] whitespace-nowrap">
                {website.title || 'Untitled Website'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <ExternalLink className="w-3 h-3 text-gray-400" />
                <a 
                  href={website.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-blue-600 truncate"
                >
                  {website.url}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusConfig.color} border`}>
              <StatusIcon className={`w-3 h-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
              {statusConfig.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/websites/${website.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                {realTimeStatus === 'ready' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/websites/${website.id}/manage-chatbot`}>
                      <Bot className="w-4 h-4 mr-2" />
                      Manage Chatbot
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/websites/${website.id}/settings`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {realTimeStatus === 'error' && onRetryScaping && (
                  <DropdownMenuItem onClick={() => onRetryScaping(website.id)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Setup
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(website.id)}
                    className="text-red-600"
                  >
                    Delete Website
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {website.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {website.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{statusConfig.description}</span>
            <span className="text-gray-500">{timeElapsed}</span>
          </div>
          
          {isProcessing && (
            <div className="space-y-2">
              <Progress 
                value={progress} 
                className={`h-2 ${
                  realTimeStatus === 'error' ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'
                }`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {realTimeStatus === 'pending' ? 'Queued' : 
                   realTimeStatus === 'scraping' ? 'Analyzing content...' : 
                   realTimeStatus === 'processing' ? 'Setting up AI...' : 
                   'Processing...'}
                </span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {realTimeStatus === 'ready' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Chatbot is live and ready to use!
              </span>
            </div>
          )}

          {realTimeStatus === 'error' && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800 font-medium">
                  Setup failed - please try again
                </span>
              </div>
              {onRetryScaping && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRetryScaping(website.id)}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {realTimeStatus === 'ready' && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href={`/dashboard/websites/${website.id}`}>
                View Details
              </Link>
            </Button>
            <Button size="sm" asChild className="flex-1">
              <Link href={`/dashboard/websites/${website.id}/manage-chatbot`}>
                <Bot className="w-3 h-3 mr-1" />
                Manage Bot
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// src/app/dashboard/websites/page.tsx - UPDATED WITH REAL-TIME STATUS
// ============================================================================

