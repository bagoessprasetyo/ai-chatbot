// src/components/ui/alert-dialog-components.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Trash2,
  AlertCircle
} from 'lucide-react'

// Types for different alert types
export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'delete'

interface AlertConfig {
  type: AlertType
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

// Global state for alerts
let setGlobalAlert: React.Dispatch<React.SetStateAction<AlertConfig | null>> | null = null

// Alert Provider Component
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setGlobalAlert = setAlert
    return () => {
      setGlobalAlert = null
    }
  }, [])

  const handleConfirm = async () => {
    if (alert?.onConfirm) {
      setIsLoading(true)
      try {
        await alert.onConfirm()
      } catch (error) {
        console.error('Alert confirm error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    setAlert(null)
  }

  const handleCancel = () => {
    alert?.onCancel?.()
    setAlert(null)
  }

  const getIcon = () => {
    switch (alert?.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-600" />
      case 'confirm':
        return <AlertCircle className="w-6 h-6 text-blue-600" />
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getButtonVariant = () => {
    switch (alert?.type) {
      case 'error':
      case 'delete':
        return 'destructive'
      case 'warning':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <>
      {children}
      <AlertDialog open={!!alert} onOpenChange={(open: any) => !open && handleCancel()}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              {getIcon()}
              {alert?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              {alert?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alert?.type === 'info' || alert?.type === 'success' || alert?.type === 'error' ? (
              // Info/Success/Error only needs OK button
              <AlertDialogAction onClick={() => setAlert(null)}>
                OK
              </AlertDialogAction>
            ) : (
              // Confirmation dialogs need Cancel + Confirm
              <>
                <AlertDialogCancel onClick={handleCancel}>
                  {alert?.cancelText || 'Cancel'}
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirm}
                //   variant={getButtonVariant()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    alert?.confirmText || 'Confirm'
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Helper functions to show different types of alerts
export const showAlert = {
  info: (title: string, description: string) => {
    setGlobalAlert?.({
      type: 'info',
      title,
      description
    })
  },

  success: (title: string, description: string) => {
    setGlobalAlert?.({
      type: 'success',
      title,
      description
    })
  },

  error: (title: string, description: string) => {
    setGlobalAlert?.({
      type: 'error',
      title,
      description
    })
  },

  warning: (title: string, description: string) => {
    setGlobalAlert?.({
      type: 'warning',
      title,
      description
    })
  },

  confirm: (
    title: string, 
    description: string, 
    onConfirm: () => void | Promise<void>,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setGlobalAlert?.({
        type: 'confirm',
        title,
        description,
        confirmText,
        cancelText,
        onConfirm: async () => {
          await onConfirm()
          resolve(true)
        },
        onCancel: () => resolve(false)
      })
    })
  },

  delete: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    itemName?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setGlobalAlert?.({
        type: 'delete',
        title: title || 'Delete Item',
        description: description || `Are you sure you want to delete ${itemName || 'this item'}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await onConfirm()
          resolve(true)
        },
        onCancel: () => resolve(false)
      })
    })
  }
}

// Legacy support functions for easy migration
export const confirmDialog = (message: string): Promise<boolean> => {
  return showAlert.confirm(
    'Confirm Action',
    message,
    () => Promise.resolve()
  )
}

export const alertDialog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  const title = type === 'success' ? 'Success' : 
                type === 'error' ? 'Error' : 'Information'
  
  switch (type) {
    case 'success':
      showAlert.success(title, message)
      break
    case 'error':
      showAlert.error(title, message)
      break
    default:
      showAlert.info(title, message)
  }
}