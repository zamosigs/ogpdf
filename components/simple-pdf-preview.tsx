'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Download, Eye, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SimplePDFPreviewProps {
  file: File | null
  files?: File[]  // Add support for multiple files
  className?: string
  watermarkSettings?: {
    text: string
    fontSize: number
    color: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right' | 'top-center' | 'bottom-center'
    angle: number
  } | null
}

export function SimplePDFPreview({ file, files, className, watermarkSettings }: SimplePDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isImage = file?.type.startsWith('image/')
  const isPDF = file?.type === 'application/pdf'
  const hasMultipleImages = files && files.length > 1 && files.every(f => f.type.startsWith('image/'))

  useEffect(() => {
    // Handle multiple images
    if (hasMultipleImages && files) {
      setLoading(true)
      setError(null)
      
      const urls = files.map(f => URL.createObjectURL(f))
      setImageUrls(urls)
      setPdfUrl(null)
      setImageUrl(null)
      setLoading(false)
      
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url))
        setImageUrls([])
      }
    }
    // Handle single file
    else if (file) {
      setLoading(true)
      setError(null)
      
      console.log('SimplePDFPreview: File detected', {
        name: file.name,
        type: file.type,
        size: file.size,
        isPDF,
        isImage
      })
      
      // Create object URL for the file
      const url = URL.createObjectURL(file)
      console.log('SimplePDFPreview: Object URL created:', url)
      
      if (isPDF) {
        setPdfUrl(url)
        setImageUrl(null)
        setImageUrls([])
        console.log('SimplePDFPreview: Set as PDF')
      } else if (isImage) {
        setImageUrl(url)
        setPdfUrl(null)
        setImageUrls([])
        console.log('SimplePDFPreview: Set as Image')
      }
      
      setLoading(false)
      
      // Cleanup function
      return () => {
        console.log('SimplePDFPreview: Cleaning up URL')
        URL.revokeObjectURL(url)
        setPdfUrl(null)
        setImageUrl(null)
      }
    } else {
      setPdfUrl(null)
      setImageUrl(null)
      setImageUrls([])
      setError(null)
    }
  }, [file, files, isPDF, isImage, hasMultipleImages])

  if (!file) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* Professional Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">File Preview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">PDF & Image viewer</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No File Selected</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Upload a PDF or image file from the sidebar to see a live preview here
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
              <FileText className="h-4 w-4 mr-2" />
              Ready to preview
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isPDF && !isImage) {
    return (
      <Card className={`border-2 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="text-xl font-bold">File Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-lg font-medium">Unsupported File Type</p>
              <p className="text-sm mt-2">Please upload a PDF or image file to see the preview</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={`border-2 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="text-xl font-bold">{isImage ? 'Image' : 'PDF'} Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading {isImage ? 'image' : 'PDF'} preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-2 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="text-xl font-bold">{isImage ? 'Image' : 'PDF'} Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <div className="text-destructive mb-2">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">{isImage ? 'Image' : 'PDF'} Preview Unavailable</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-sm">
              <p className="text-sm font-medium">File Information:</p>
              <p className="text-xs text-muted-foreground mt-1">
                Name: {file?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {((file?.size || 0) / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-muted-foreground">
                Type: {file?.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Professional Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {hasMultipleImages ? `${imageUrls.length} Images` : isImage ? 'Image' : 'PDF'} Preview
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasMultipleImages ? 'Multiple images viewer' : `Interactive ${isImage ? 'image' : 'document'} viewer`}
            </p>
          </div>
        </div>
        {!hasMultipleImages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement('a')
              a.href = isImage ? imageUrl! : pdfUrl!
              a.download = file.name
              a.click()
            }}
            className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      {/* File Info Bar */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ready</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {hasMultipleImages ? `${imageUrls.length} images` : file.name}
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {hasMultipleImages 
              ? `Total: ${(files!.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB`
              : `${(file.size / 1024 / 1024).toFixed(2)} MB`
            }
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800">
        {/* Multiple Images */}
        {hasMultipleImages && imageUrls.length > 0 ? (
          <div className="w-full p-4 space-y-6">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Image {index + 1} of {imageUrls.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {files![index].name}
                  </span>
                </div>
                <div className="flex items-center justify-center relative">
                  <img
                    src={url}
                    alt={files![index].name}
                    className="max-w-full object-contain rounded-lg"
                    style={{ maxHeight: '600px' }}
                    onError={(e) => {
                      console.error('Image load error:', e)
                    }}
                  />
                  {/* Watermark Overlay */}
                  {watermarkSettings && (
                    <div 
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      style={{
                        color: watermarkSettings.color,
                        opacity: watermarkSettings.opacity,
                        fontSize: `${watermarkSettings.fontSize}px`,
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: 'bold',
                        transform: `rotate(${watermarkSettings.angle}deg)`,
                        textShadow: '0 0 10px rgba(255,255,255,0.5)'
                      }}
                    >
                      {watermarkSettings.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isImage ? (
          /* Single Image */
          <div className="w-full h-full flex items-center justify-center p-4 relative">
            <img
              src={imageUrl!}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              style={{ maxHeight: 'calc(100vh - 250px)' }}
              onError={(e) => {
                console.error('Image load error:', e)
                setError('Failed to load image preview')
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
            {/* Watermark Overlay for Images */}
            {watermarkSettings && (
              <div 
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  color: watermarkSettings.color,
                  opacity: watermarkSettings.opacity,
                  fontSize: `${watermarkSettings.fontSize}px`,
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontWeight: 'bold',
                  transform: `rotate(${watermarkSettings.angle}deg)`,
                  textShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}
              >
                {watermarkSettings.text}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-inner m-4 relative">
            <iframe
              src={pdfUrl!}
              className="w-full h-full min-h-[500px] border-0"
              title="PDF Preview"
              onError={(e) => {
                console.error('PDF load error:', e)
                setError('Failed to load PDF preview')
              }}
            />
            {/* Watermark Overlay for PDFs */}
            {watermarkSettings && (
              <div 
                className="absolute pointer-events-none flex"
                style={{
                  inset: 0,
                  alignItems: watermarkSettings.position.includes('top') ? 'flex-start' : 
                             watermarkSettings.position.includes('bottom') ? 'flex-end' : 'center',
                  justifyContent: watermarkSettings.position.includes('left') ? 'flex-start' :
                                  watermarkSettings.position.includes('right') ? 'flex-end' : 'center',
                  padding: watermarkSettings.position === 'center' ? '0' : '50px',
                }}
              >
                <div
                  style={{
                    color: watermarkSettings.color,
                    opacity: watermarkSettings.opacity,
                    fontSize: `${watermarkSettings.fontSize}px`,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontWeight: 'bold',
                    transform: `rotate(${watermarkSettings.angle}deg)`,
                    textShadow: '0 0 20px rgba(255,255,255,0.8)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {watermarkSettings.text}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
