'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatFileSize, isValidPdfFile, isValidImageFile } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedFileTypes?: string[]
  maxFiles?: number
  className?: string
}

export function FileUpload({ 
  onFilesSelected, 
  acceptedFileTypes = ['application/pdf', 'image/*'],
  maxFiles = 10,
  className 
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }, [files, maxFiles, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: maxFiles - files.length,
    multiple: true
  })

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const clearAllFiles = () => {
    setFiles([])
    onFilesSelected([])
  }

  if (!isClient) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Loading file upload...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg' 
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:scale-105'
          }
        `}
      >
            <input {...getInputProps()} />
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400 mb-4">
              or click to select files
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2 inline-block">
              Supports PDF and image files (max {maxFiles} files)
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                            {formatFileSize(file.size)}
                          </span>
                          <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
                            {isValidPdfFile(file) ? 'PDF' : 
                             isValidImageFile(file) ? 'Image' : 
                             'Unknown'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  )
}
