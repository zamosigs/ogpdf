'use client'

import React from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getErrorInfo, getErrorSeverity } from '@/lib/error-handler'

interface EnhancedToastProps {
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  error?: Error | string
  onClose?: () => void
  className?: string
}

export function EnhancedToast({ 
  title, 
  description, 
  type = 'info', 
  error,
  onClose,
  className 
}: EnhancedToastProps) {
  const errorInfo = error ? getErrorInfo(error) : null
  const severity = error ? getErrorSeverity(error) : 'low'
  
  const getIcon = () => {
    if (errorInfo) {
      switch (severity) {
        case 'high':
          return <AlertCircle className="h-5 w-5 text-red-500" />
        case 'medium':
          return <AlertCircle className="h-5 w-5 text-yellow-500" />
        default:
          return <Info className="h-5 w-5 text-blue-500" />
      }
    }
    
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    if (errorInfo) {
      switch (severity) {
        case 'high':
          return 'bg-red-50 border-red-200'
        case 'medium':
          return 'bg-yellow-50 border-yellow-200'
        default:
          return 'bg-blue-50 border-blue-200'
      }
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    if (errorInfo) {
      switch (severity) {
        case 'high':
          return 'text-red-800'
        case 'medium':
          return 'text-yellow-800'
        default:
          return 'text-blue-800'
      }
    }
    
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      default:
        return 'text-blue-800'
    }
  }

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-md w-full mx-auto',
      'border-2 rounded-lg shadow-lg p-4',
      'animate-in slide-in-from-top-2 duration-300',
      getBackgroundColor(),
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn('text-sm font-semibold', getTextColor())}>
              {errorInfo ? errorInfo.message : title}
            </h4>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {(errorInfo?.suggestion || description) && (
            <p className={cn('mt-1 text-sm', getTextColor())}>
              {errorInfo?.suggestion || description}
            </p>
          )}
          
          {errorInfo && (
            <div className="mt-2 text-xs text-gray-600">
              Error Code: {errorInfo.code}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
