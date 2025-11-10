'use client'

import React, { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false })

interface PDFPreviewProps {
  file: File | null
  className?: string
}

export function PDFPreview({ file, className }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setLoading(true)
      setError(null)
      setPageNumber(1)
      setScale(1.0)
      setRotation(0)
      
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (loading) {
          setError('PDF preview timed out. The file might be corrupted or too large.')
          setLoading(false)
        }
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    }
  }, [file, loading])

  // Set up PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then(({ pdfjs }) => {
        // Use a more reliable worker source
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      }).catch((error) => {
        console.error('Failed to load PDF.js:', error)
        setError('Failed to initialize PDF viewer')
      })
    }
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }, [])

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  if (!file) {
    return (
      <Card className={`border-2 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="text-xl font-bold">PDF Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No PDF file selected</p>
              <p className="text-sm mt-2">Upload a PDF file to see the preview</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Only render PDF preview on client side
  if (typeof window === 'undefined') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>PDF Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Loading PDF preview...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-2 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="font-bold">PDF Preview</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-primary min-w-[60px] text-center bg-primary/10 px-2 py-1 rounded">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
              className="hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <div className="text-destructive mb-2">
              <p className="font-semibold">PDF Preview Unavailable</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {file && (
              <div className="bg-muted/50 rounded-lg p-4 max-w-sm">
                <p className="text-sm font-medium">File Information:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Name: {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Type: {file.type}
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center justify-center mb-4">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className="pdf-page"
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  }
                />
              </Document>
            </div>

            {numPages && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
