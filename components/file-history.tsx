'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Download, Trash2, FileText, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'

interface FileHistoryItem {
  id: string
  name: string
  type: 'pdf' | 'image'
  size: number
  timestamp: Date
  operation: string
  status: 'completed' | 'failed'
  downloadUrl?: string
}

interface FileHistoryProps {
  className?: string
}

export function FileHistory({ className }: FileHistoryProps) {
  const [history, setHistory] = useState<FileHistoryItem[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('pdf-tool-history')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (error) {
        console.error('Error loading file history:', error)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('pdf-tool-history', JSON.stringify(history))
    }
  }, [history])

  const addToHistory = (item: Omit<FileHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: FileHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setHistory(prev => [newItem, ...prev].slice(0, 50)) // Keep only last 50 items
  }

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('pdf-tool-history')
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getFileIcon = (type: string) => {
    return type === 'pdf' ? <FileText className="h-4 w-4" /> : <Image className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'text-green-600' : 'text-red-600'
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">File History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No files processed yet. Your processing history will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">File History</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(isExpanded ? history : history.slice(0, 3)).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-muted-foreground">
                  {getFileIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(item.size)}</span>
                    <span>•</span>
                    <span className={getStatusColor(item.status)}>{item.operation}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {item.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = item.downloadUrl!
                      a.download = item.name
                      a.click()
                    }}
                    className="hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromHistory(item.id)}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {history.length > 3 && !isExpanded && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-primary"
              >
                Show {history.length - 3} more
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export function to add items to history
export const addToFileHistory = (item: Omit<FileHistoryItem, 'id' | 'timestamp'>) => {
  // This would be called from the parent component
  // Implementation depends on how you want to manage state
}
