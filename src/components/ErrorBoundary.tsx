'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { APIError } from '@/lib/api-utils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Toast error handler
export function handleError(error: unknown, defaultMessage = 'An error occurred') {
  const message = error instanceof APIError 
    ? error.message 
    : error instanceof Error 
      ? error.message 
      : defaultMessage

  console.error('Error:', error)
  
  // You can add additional error reporting here
  // e.g., send to error tracking service
  
  return message
}