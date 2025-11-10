'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface BatchJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: Blob
}

interface BatchProcessorProps {
  jobs: BatchJob[]
  onJobComplete: (jobId: string, result: Blob) => void
  onJobError: (jobId: string, error: string) => void
  onClearCompleted: () => void
}

export function BatchProcessor({ jobs, onJobComplete, onJobError, onClearCompleted }: BatchProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentJob, setCurrentJob] = useState<string | null>(null)

  const completedJobs = jobs.filter(job => job.status === 'completed')
  const pendingJobs = jobs.filter(job => job.status === 'pending')
  const processingJobs = jobs.filter(job => job.status === 'processing')
  const errorJobs = jobs.filter(job => job.status === 'error')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'processing':
        return 'border-blue-200 bg-blue-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (jobs.length === 0) return null

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Batch Processing Queue</CardTitle>
          {completedJobs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              className="hover:bg-primary/10"
            >
              Clear Completed
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Processing Status */}
          {processingJobs.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="font-semibold text-blue-700">Processing...</span>
              </div>
              <Progress value={processingJobs[0]?.progress || 0} className="w-full" />
            </div>
          )}

          {/* Job List */}
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusColor(job.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium text-sm">{job.name}</p>
                      {job.status === 'processing' && (
                        <p className="text-xs text-muted-foreground">
                          {job.progress}% complete
                        </p>
                      )}
                      {job.status === 'error' && job.error && (
                        <p className="text-xs text-red-600">{job.error}</p>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'completed' && job.result && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = URL.createObjectURL(job.result!)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${job.name}_result`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="hover:bg-primary/10"
                    >
                      Download
                    </Button>
                  )}
                </div>
                
                {job.status === 'processing' && (
                  <div className="mt-2">
                    <Progress value={job.progress} className="w-full h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{processingJobs.length}</div>
              <div className="text-xs text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{pendingJobs.length}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorJobs.length}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
