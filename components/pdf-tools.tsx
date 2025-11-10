'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  Scissors, 
  Minimize2 as Compress, 
  Edit3, 
  Eye, 
  Image, 
  FileImage,
  Download,
  Loader2,
  List,
  Droplets,
  X,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { downloadFile } from '@/lib/utils'
import { InputDialog } from '@/components/input-dialog'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { OCRDialog } from '@/components/ocr-dialog'
import { OCRResultDialog } from '@/components/ocr-result-dialog'
import { CompressDialog } from '@/components/compress-dialog'
import { ImagesToPDFDialog } from '@/components/images-to-pdf-dialog'
import { PDFToImagesDialog } from '@/components/pdf-to-images-dialog'
import { WatermarkDialog } from '@/components/watermark-dialog'
import { BatchProcessor } from '@/components/batch-processor'
import { PDFDocument } from 'pdf-lib'

interface BatchJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: Blob
}

interface PDFToolsProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onWatermarkChange?: (settings: {
    text: string
    fontSize: number
    color: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    angle: number
  } | null) => void
  onToolSelect?: (tool: string) => void
}

export function PDFTools({ files, onFilesChange, onWatermarkChange, onToolSelect }: PDFToolsProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Watermark settings state
  const [watermarkSettings, setWatermarkSettings] = useState({
    text: 'WATERMARK',
    fontSize: 48,
    color: '#000000',
    opacity: 0.3,
    position: 'center' as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    angle: 45
  })
  
  // Batch processing state
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([])
  const [showBatchQueue, setShowBatchQueue] = useState(false)

  // Dialog states
  const [inputDialog, setInputDialog] = useState<{
    open: boolean
    title: string
    description: string
    placeholder: string
    label: string
    onConfirm: (value: string) => void
  }>({
    open: false,
    title: '',
    description: '',
    placeholder: '',
    label: '',
    onConfirm: () => {}
  })

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    type: 'info' | 'warning' | 'error' | 'success'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'info'
  })


  const [ocrDialog, setOcrDialog] = useState<{
    open: boolean
    fileName: string
  }>({
    open: false,
    fileName: ''
  })

  const [ocrResultDialog, setOcrResultDialog] = useState<{
    open: boolean
    result: {
      text: string
      confidence: number
      wordCount: number
      characterCount: number
      language: string
      fileName: string
    } | null
  }>({
    open: false,
    result: null
  })

  const [compressDialog, setCompressDialog] = useState<{
    open: boolean
    fileName: string
  }>({
    open: false,
    fileName: ''
  })

  const [imagesToPdfDialog, setImagesToPdfDialog] = useState<{
    open: boolean
    fileCount: number
  }>({
    open: false,
    fileCount: 0
  })

  const [pdfToImagesDialog, setPdfToImagesDialog] = useState<{
    open: boolean
    fileName: string
  }>({
    open: false,
    fileName: ''
  })

  const [watermarkDialog, setWatermarkDialog] = useState<{
    open: boolean
    fileName: string
  }>({
    open: false,
    fileName: ''
  })

  // Update parent component with watermark settings for live preview
  React.useEffect(() => {
    if (activeTool === 'watermark' && onWatermarkChange && watermarkSettings.text) {
      onWatermarkChange(watermarkSettings)
    } else if (activeTool !== 'watermark' && onWatermarkChange) {
      onWatermarkChange(null)
    }
  }, [activeTool, watermarkSettings, onWatermarkChange])

  const handleApiCall = async (endpoint: string, formData: FormData, filename: string) => {
    setLoading(true)
    setProgress(0)
    
    try {
      const response = await fetch(`/api/pdf/${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Operation failed'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `${response.status}: ${response.statusText || 'Operation failed'}`
        }
        throw new Error(errorMessage)
      }

      // Simulate progress with real-time updates
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const blob = await response.blob()
      clearInterval(interval)
      setProgress(100)

      downloadFile(blob, filename)
      
      toast({
        title: "Success",
        description: "File processed and downloaded successfully!",
      })
    } catch (error) {
      console.error('API call error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
      setActiveTool(null)
    }
  }

  // Enhanced batch processing with queue
  const addToBatchQueue = async (
    endpoint: string, 
    formData: FormData, 
    filename: string,
    jobName: string
  ) => {
    const jobId = `job-${Date.now()}-${Math.random()}`
    
    const newJob: BatchJob = {
      id: jobId,
      name: jobName,
      status: 'pending',
      progress: 0
    }
    
    setBatchJobs(prev => [...prev, newJob])
    setShowBatchQueue(true)
    
    // Start processing
    setTimeout(() => processBatchJob(jobId, endpoint, formData, filename), 100)
  }

  const processBatchJob = async (
    jobId: string,
    endpoint: string,
    formData: FormData,
    filename: string
  ) => {
    // Update status to processing
    setBatchJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'processing' as const, progress: 0 } : job
    ))
    
    try {
      const response = await fetch(`/api/pdf/${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setBatchJobs(prev => prev.map(job => 
          job.id === jobId && job.progress < 90 
            ? { ...job, progress: Math.min(job.progress + 10, 90) } 
            : job
        ))
      }, 200)

      if (!response.ok) {
        clearInterval(progressInterval)
        let errorMessage = 'Operation failed'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText || 'Operation failed'}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      clearInterval(progressInterval)
      
      // Update to completed
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed' as const, progress: 100, result: blob } 
          : job
      ))
      
      toast({
        title: "Job Complete",
        description: `${filename} processed successfully!`,
      })
    } catch (error) {
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Operation failed' 
            } 
          : job
      ))
      
      toast({
        title: "Job Failed",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleClearCompleted = () => {
    setBatchJobs(prev => prev.filter(job => job.status !== 'completed'))
    if (batchJobs.filter(job => job.status !== 'completed').length === 0) {
      setShowBatchQueue(false)
    }
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Error",
        description: "At least 2 PDF files are required for merging",
        variant: "destructive",
      })
      return
    }

    setActiveTool('merge')
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    await handleApiCall('merge', formData, 'merged.pdf')
  }

  const handleSplit = async () => {
    if (files.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 PDF file for splitting",
        variant: "destructive",
      })
      return
    }

    setInputDialog({
      open: true,
      title: 'Split PDF',
      description: 'Enter the page ranges you want to extract from the PDF.',
      placeholder: 'e.g., 1-3,5,7-9',
      label: 'Page Ranges',
      onConfirm: async (pageRanges) => {
        setActiveTool('split')
        const formData = new FormData()
        formData.append('file', files[0])
        formData.append('pageRanges', pageRanges)
        await handleApiCall('split', formData, 'split_pdf.zip')
      }
    })
  }

  const handleCompress = async () => {
    if (files.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 PDF file for compression",
        variant: "destructive",
      })
      return
    }

    setCompressDialog({
      open: true,
      fileName: files[0].name
    })
  }

  const performCompress = async (options: {
    quality: number
  }) => {
    setActiveTool('compress')
    const formData = new FormData()
    formData.append('file', files[0])
    formData.append('quality', (options.quality / 100).toString()) // Convert to 0.1-1.0
    await handleApiCall('compress', formData, 'compressed.pdf')
  }

  const handleEdit = async () => {
    if (files.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 PDF file for editing",
        variant: "destructive",
      })
      return
    }

    // The live editor will handle the editing interface
    toast({
      title: "Edit Mode",
      description: "Use the live editor on the right to edit your PDF",
    })
  }

  const handleOCR = async () => {
    if (files.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 file for OCR",
        variant: "destructive",
      })
      return
    }

    const file = files[0]

    // Check file size (1 MB = 1,048,576 bytes)
    const maxSizeInBytes = 1 * 1024 * 1024 // 1 MB
    if (file.size > maxSizeInBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      toast({
        title: "File Too Large",
        description: `PDF size is ${fileSizeMB} MB. OCR only supports files up to 1 MB.`,
        variant: "destructive",
      })
      return
    }

    // Check if it's a PDF and validate page count
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pageCount = pdfDoc.getPageCount()

        if (pageCount > 3) {
          toast({
            title: "Too Many Pages",
            description: `PDF has ${pageCount} pages. OCR only supports PDFs with up to 3 pages.`,
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        console.error('Error checking PDF pages:', error)
        toast({
          title: "Error",
          description: "Failed to read PDF. Please ensure it's a valid PDF file.",
          variant: "destructive",
        })
        return
      }
    }

    setOcrDialog({
      open: true,
      fileName: files[0].name
    })
  }

  const handleOCRConfirm = async (ocrData: any) => {
    setActiveTool('ocr')
    setLoading(true)
    setProgress(0)
    
    try {
      console.log('Starting OCR with data:', ocrData)
      const formData = new FormData()
      formData.append('file', files[0])
      
      // Add all OCR data to form
      Object.keys(ocrData).forEach(key => {
        if (ocrData[key] !== '' && ocrData[key] !== null && ocrData[key] !== undefined) {
          formData.append(key, ocrData[key].toString())
        }
      })
      
      console.log('Sending OCR request...')
      
      const response = await fetch('/api/pdf/ocr', {
        method: 'POST',
        body: formData,
      })

      console.log('OCR response received:', response.status)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'OCR failed')
      }

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await response.json()
      clearInterval(interval)
      setProgress(100)
      
      console.log('OCR result:', result)

      // Show result in beautiful dialog
      setOcrResultDialog({
        open: true,
        result: {
          text: result.text || 'No text extracted',
          confidence: result.confidence || 0,
          wordCount: result.wordCount || 0,
          characterCount: result.characterCount || 0,
          language: result.language || 'eng',
          fileName: files[0].name
        }
      })
      
      toast({
        title: "OCR Complete!",
        description: `Text extracted successfully (${result.confidence}% confidence)`,
      })
    } catch (error) {
      console.error('OCR error:', error)
      toast({
        title: "OCR Failed",
        description: error instanceof Error ? error.message : "Failed to extract text",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
      setActiveTool(null)
    }
  }

  const handleJpgToPdf = async () => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least 1 image file",
        variant: "destructive",
      })
      return
    }

    setImagesToPdfDialog({
      open: true,
      fileCount: imageFiles.length
    })
  }

  const handleImagesToPdfConfirm = async (conversionData: any) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setActiveTool('jpg-to-pdf')
    
    // Show processing toast
    toast({
      title: "🔄 Converting Images to PDF...",
      description: `Processing ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`,
      duration: 3000,
    })
    
    const formData = new FormData()
    imageFiles.forEach(file => formData.append('files', file))
    
    // Add all conversion data to form
    Object.keys(conversionData).forEach(key => {
      if (conversionData[key] !== '' && conversionData[key] !== null && conversionData[key] !== undefined) {
        formData.append(key, conversionData[key].toString())
      }
    })
    
    await handleApiCall('jpg-to-pdf', formData, conversionData.outputName || 'images-to-pdf.pdf')
  }

  const handlePdfToJpg = async () => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf')
    if (pdfFiles.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 PDF file",
        variant: "destructive",
      })
      return
    }

    setPdfToImagesDialog({
      open: true,
      fileName: pdfFiles[0].name
    })
  }

  const handlePdfToImagesConfirm = async (conversionData: any) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf')
    setActiveTool('pdf-to-jpg')
    setLoading(true)
    setProgress(0)

    try {
      // Load PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      
      // Read PDF file
      const arrayBuffer = await pdfFiles[0].arrayBuffer()
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdfDocument = await loadingTask.promise
      const pageCount = pdfDocument.numPages

      // Parse page range
      let pagesToConvert: number[] = []
      if (conversionData.pageRange) {
        const ranges = conversionData.pageRange.split(',')
        for (const range of ranges) {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map((n: string) => parseInt(n.trim()))
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= pageCount) {
                pagesToConvert.push(i)
              }
            }
          } else {
            const pageNum = parseInt(range.trim())
            if (pageNum >= 1 && pageNum <= pageCount) {
              pagesToConvert.push(pageNum)
            }
          }
        }
        pagesToConvert = Array.from(new Set(pagesToConvert)).sort((a, b) => a - b)
      } else {
        pagesToConvert = Array.from({ length: pageCount }, (_, i) => i + 1)
      }

      if (pagesToConvert.length === 0) {
        throw new Error('No valid pages to convert')
      }

      const scale = conversionData.dpi / 72
      const quality = conversionData.quality / 100
      const format = conversionData.format
      const images: Array<{ pageNum: number, dataUrl: string }> = []

      // Render each page
      for (let i = 0; i < pagesToConvert.length; i++) {
        const pageNum = pagesToConvert[i]
        setProgress(Math.round((i / pagesToConvert.length) * 100))

        const page = await pdfDocument.getPage(pageNum)
        const viewport = page.getViewport({ scale })

        // Create canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        if (!context) {
          throw new Error('Could not get canvas context')
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        // Convert canvas to data URL
        let dataUrl: string
        if (format === 'png') {
          dataUrl = canvas.toDataURL('image/png')
        } else if (format === 'webp') {
          dataUrl = canvas.toDataURL('image/webp', quality)
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        images.push({ pageNum, dataUrl })

        // Clean up canvas
        canvas.remove()
      }

      setProgress(100)

      // Send rendered images to server to create ZIP
      const formData = new FormData()
      formData.append('images', JSON.stringify(images))
      formData.append('format', format)

      await handleApiCall('pdf-to-jpg', formData, 'converted_images.zip')

    } catch (error) {
      console.error('Error converting PDF to images:', error)
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : 'Failed to convert PDF to images',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setActiveTool(null)
    }
  }

  const handleWatermark = async () => {
    if (files.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly 1 PDF file for watermarking",
        variant: "destructive",
      })
      return
    }

    // Activate watermark tool to show settings in sidebar
    if (activeTool === 'watermark') {
      setActiveTool(null)
      if (onWatermarkChange) {
        onWatermarkChange(null) // Clear preview
      }
      if (onToolSelect) {
        onToolSelect('') // Deactivate tool
      }
    } else {
      setActiveTool('watermark')
      if (onToolSelect) {
        onToolSelect('watermark') // Activate watermark tool in editor toolbar
      }
    }
  }

  const handleWatermarkConfirm = async (watermarkData: any) => {
    setActiveTool('watermark')
    const formData = new FormData()
    formData.append('file', files[0])
    
    // Add all watermark data to form
    Object.keys(watermarkData).forEach(key => {
      if (watermarkData[key] !== '' && watermarkData[key] !== null && watermarkData[key] !== undefined) {
        formData.append(key, watermarkData[key].toString())
      }
    })
    
    await handleApiCall('watermark', formData, 'watermarked.pdf')
    
    // Close inline settings after successful application
    setActiveTool(null)
  }

  const tools = [
    {
      id: 'merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDFs into one',
      icon: FileText,
      onClick: handleMerge,
      requiresMultiple: true,
      fileType: 'pdf'
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Split PDF into multiple files',
      icon: Scissors,
      onClick: handleSplit,
      requiresSingle: true,
      fileType: 'pdf'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce PDF file size',
      icon: Compress,
      onClick: handleCompress,
      requiresSingle: true,
      fileType: 'pdf'
    },
    {
      id: 'edit',
      name: 'Edit PDF',
      description: 'Rotate, delete, add text, watermarks',
      icon: Edit3,
      onClick: handleEdit,
      requiresSingle: true,
      fileType: 'pdf'
    },
    {
      id: 'ocr',
      name: 'OCR Text',
      description: 'Extract text from images/PDFs',
      icon: Eye,
      onClick: handleOCR,
      requiresSingle: true,
      fileType: 'any'
    },
    {
      id: 'jpg-to-pdf',
      name: 'Images to PDF',
      description: 'Convert images to PDF',
      icon: Image,
      onClick: handleJpgToPdf,
      requiresMultiple: false, // Allow single or multiple images
      fileType: 'image'
    },
    {
      id: 'pdf-to-jpg',
      name: 'PDF to Images',
      description: 'Convert PDF pages to images',
      icon: FileImage,
      onClick: handlePdfToJpg,
      requiresSingle: true,
      fileType: 'pdf'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Batch Processor */}
      {showBatchQueue && batchJobs.length > 0 && (
        <BatchProcessor
          jobs={batchJobs}
          onJobComplete={(jobId, result) => {
            console.log('Job completed:', jobId)
          }}
          onJobError={(jobId, error) => {
            console.log('Job error:', jobId, error)
          }}
          onClearCompleted={handleClearCompleted}
        />
      )}

      <div>
        {/* Helper message for image files */}
        {files.length > 0 && files.every(f => f.type.startsWith('image/')) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>
                <strong>📸 Image files detected!</strong> Use <strong>"Images to PDF"</strong> to convert {files.length} image{files.length > 1 ? 's' : ''} to a PDF document.
              </span>
            </p>
          </div>
        )}
        
        {/* Helper message for PDF files */}
        {files.length > 0 && files.every(f => f.type === 'application/pdf') && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                <strong>📄 PDF files detected!</strong> Select a tool below to merge, split, compress, or edit your PDF{files.length > 1 ? 's' : ''}.
              </span>
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isDisabled = loading || 
                (tool.requiresSingle && files.length !== 1) ||
                (tool.requiresMultiple && files.length < 2) ||
                (tool.fileType === 'pdf' && !files.some(f => f.type === 'application/pdf')) ||
                (tool.fileType === 'image' && !files.some(f => f.type.startsWith('image/')))
              
              return (
                <Button
                  key={tool.id}
                  variant="outline"
                  className={`h-auto py-2.5 px-3 flex items-center space-x-3 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 justify-start ${
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onClick={tool.onClick}
                  disabled={isDisabled}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    {loading && activeTool === tool.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {tool.name}
                    </div>
                  </div>
                </Button>
              )
            })}
        </div>
      </div>

      {/* Inline Watermark Settings */}
      {activeTool === 'watermark' && (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Watermark Settings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Watermark Text */}
              <div className="space-y-2">
                <Label htmlFor="watermark-text" className="text-sm font-medium">
                  Watermark Text
                </Label>
                <Input
                  id="watermark-text"
                  type="text"
                  value={watermarkSettings.text}
                  onChange={(e) => setWatermarkSettings(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter watermark text"
                  className="w-full"
                />
              </div>

              {/* Two Column Layout for Related Settings */}
              <div className="grid grid-cols-2 gap-3">
                {/* Font Size */}
                <div className="space-y-2">
                  <Label htmlFor="watermark-font-size" className="text-sm font-medium flex items-center justify-between">
                    Font Size
                    <span className="text-xs text-muted-foreground">{watermarkSettings.fontSize}px</span>
                  </Label>
                  <Input
                    id="watermark-font-size"
                    type="range"
                    min="12"
                    max="120"
                    value={watermarkSettings.fontSize}
                    onChange={(e) => setWatermarkSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <Label htmlFor="watermark-opacity" className="text-sm font-medium flex items-center justify-between">
                    Opacity
                    <span className="text-xs text-muted-foreground">{Math.round(watermarkSettings.opacity * 100)}%</span>
                  </Label>
                  <Input
                    id="watermark-opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={watermarkSettings.opacity}
                    onChange={(e) => setWatermarkSettings(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="watermark-color" className="text-sm font-medium">
                    Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="watermark-color"
                      type="color"
                      value={watermarkSettings.color}
                      onChange={(e) => setWatermarkSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={watermarkSettings.color}
                      onChange={(e) => setWatermarkSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 h-9 text-xs font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <Label htmlFor="watermark-angle" className="text-sm font-medium flex items-center justify-between">
                    Rotation
                    <span className="text-xs text-muted-foreground">{watermarkSettings.angle}°</span>
                  </Label>
                  <Input
                    id="watermark-angle"
                    type="range"
                    min="-180"
                    max="180"
                    value={watermarkSettings.angle}
                    onChange={(e) => setWatermarkSettings(prev => ({ ...prev, angle: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="watermark-position" className="text-sm font-medium">
                  Position
                </Label>
                <select
                  id="watermark-position"
                  value={watermarkSettings.position}
                  onChange={(e) => setWatermarkSettings(prev => ({ ...prev, position: e.target.value as typeof watermarkSettings.position }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="center-left">Center Left</option>
                  <option value="center">Center</option>
                  <option value="center-right">Center Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWatermarkSettings({
                      text: 'WATERMARK',
                      fontSize: 48,
                      color: '#000000',
                      opacity: 0.3,
                      position: 'center',
                      angle: 45
                    })
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => handleWatermarkConfirm(watermarkSettings)}
                  disabled={!watermarkSettings.text.trim()}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply Watermark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-semibold text-lg">Processing...</span>
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full h-3" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we process your files...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Dialog */}
      <InputDialog
        open={inputDialog.open}
        onOpenChange={(open) => setInputDialog(prev => ({ ...prev, open }))}
        title={inputDialog.title}
        description={inputDialog.description}
        placeholder={inputDialog.placeholder}
        label={inputDialog.label}
        onConfirm={inputDialog.onConfirm}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        type={confirmDialog.type}
      />


      {/* OCR Dialog */}
      <OCRDialog
        open={ocrDialog.open}
        onOpenChange={(open) => setOcrDialog(prev => ({ ...prev, open }))}
        onConfirm={handleOCRConfirm}
        fileName={ocrDialog.fileName}
      />

      {/* OCR Result Dialog */}
      <OCRResultDialog
        open={ocrResultDialog.open}
        onOpenChange={(open) => setOcrResultDialog(prev => ({ ...prev, open }))}
        result={ocrResultDialog.result}
      />

      {/* Compress Dialog */}
      <CompressDialog
        open={compressDialog.open}
        onOpenChange={(open) => setCompressDialog(prev => ({ ...prev, open }))}
        onConfirm={performCompress}
        fileName={compressDialog.fileName}
      />

      {/* Images to PDF Dialog */}
      <ImagesToPDFDialog
        open={imagesToPdfDialog.open}
        onOpenChange={(open) => setImagesToPdfDialog(prev => ({ ...prev, open }))}
        onConfirm={handleImagesToPdfConfirm}
        fileCount={imagesToPdfDialog.fileCount}
      />

      {/* PDF to Images Dialog */}
      <PDFToImagesDialog
        open={pdfToImagesDialog.open}
        onOpenChange={(open) => setPdfToImagesDialog(prev => ({ ...prev, open }))}
        onConfirm={handlePdfToImagesConfirm}
        fileName={pdfToImagesDialog.fileName}
      />
    </div>
  )
}
