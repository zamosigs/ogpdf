'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PDFTools } from '@/components/pdf-tools'
import { 
  Type, 
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Move,
  Minus,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  X,
  FileDown,
  Image as ImageIcon,
  Droplets
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

// Configure PDF.js worker - using jsdelivr CDN for better reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`

interface Annotation {
  id: string
  type: 'pen' | 'highlighter' | 'text' | 'rectangle' | 'ellipse' | 'line' | 'watermark'
  page: number
  data: any
  color: string
  lineWidth: number
  scale: number // Store the scale at which annotation was created
  // ✅ Bounding box dimensions for selection and resizing
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface LivePDFEditorProps {
  file: File | null
  allFiles?: File[]
  onSave: (editData: any) => void
  onPreview: (previewData: any) => void
}

// ✅ Static canvas component to display annotations on non-current pages
function StaticAnnotationCanvas({ 
  pageNumber, 
  annotationsByPage,
  scale,
  activeTool,
  watermarkText,
  watermarkOpacity,
  watermarkRotation,
  watermarkFontSize,
  watermarkColor,
  watermarkPosition
}: { 
  pageNumber: number
  annotationsByPage: Record<number, Annotation[]>
  scale: number
  activeTool: string | null
  watermarkText: string
  watermarkOpacity: number
  watermarkRotation: number
  watermarkFontSize: number
  watermarkColor: string
  watermarkPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Helper functions for drawing
  const drawPath = (ctx: CanvasRenderingContext2D, path: {x: number, y: number}[], close = false) => {
    if (path.length < 2) return
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    if (close) ctx.closePath()
    ctx.stroke()
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 20
    const angle = Math.atan2(toY - fromY, toX - fromX)
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  // Update canvas whenever annotations or scale change
  useEffect(() => {
    const updateCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current.parentElement
        if (container) {
          const pdfCanvas = container.querySelector('canvas')
          if (pdfCanvas) {
            const ctx = canvasRef.current.getContext('2d')
            if (!ctx) return

            // Match PDF canvas dimensions
            canvasRef.current.width = pdfCanvas.width
            canvasRef.current.height = pdfCanvas.height
            canvasRef.current.style.width = `${pdfCanvas.offsetWidth}px`
            canvasRef.current.style.height = `${pdfCanvas.offsetHeight}px`
            
            const canvasWidth = canvasRef.current.width
            const canvasHeight = canvasRef.current.height
            
            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight)

            // Get annotations for this specific page
            const pageAnnotations = annotationsByPage[pageNumber] || []
            pageAnnotations.forEach(annotation => {
              const scaleFactor = scale / annotation.scale
              
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = annotation.lineWidth * scaleFactor
              ctx.lineCap = 'round'
              ctx.lineJoin = 'round'

              if (annotation.type === 'pen') {
                // Pen paths stored as ratios - multiply by canvas dimensions
                const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
                  x: p.x * canvasWidth,
                  y: p.y * canvasHeight
                }))
                drawPath(ctx, scaledPath, false)
              } else if (annotation.type === 'highlighter') {
                ctx.globalAlpha = 0.3
                ctx.lineWidth = annotation.lineWidth * 3 * scaleFactor
                // Highlighter paths stored as ratios - multiply by canvas dimensions
                const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
                  x: p.x * canvasWidth,
                  y: p.y * canvasHeight
                }))
                drawPath(ctx, scaledPath, false)
                ctx.globalAlpha = 1.0
              } else if (annotation.type === 'text') {
                const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
                const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
                const fontFamily = annotation.data.fontFamily || 'Arial'
                // fontSize is stored as ratio of canvas height - convert to pixels
                const fontSizePixels = annotation.data.fontSize * canvasHeight
                ctx.font = `${fontStyle} ${fontWeight} ${fontSizePixels}px ${fontFamily}`
                ctx.fillStyle = annotation.color
                ctx.textAlign = annotation.data.textAlign || 'left'
                ctx.textBaseline = 'middle'  // Center text vertically at the Y position
                // Text coordinates stored as ratios - multiply by canvas dimensions
                ctx.fillText(
                  annotation.data.text, 
                  annotation.data.x * canvasWidth, 
                  annotation.data.y * canvasHeight
                )
                ctx.textAlign = 'left' // Reset
                ctx.textBaseline = 'alphabetic'  // Reset to default
              } else if (annotation.type === 'rectangle') {
                // Rectangle coordinates stored as ratios - multiply by canvas dimensions
                ctx.strokeRect(
                  annotation.data.x * canvasWidth,
                  annotation.data.y * canvasHeight,
                  annotation.data.width * canvasWidth,
                  annotation.data.height * canvasHeight
                )
              } else if (annotation.type === 'ellipse') {
                // Ellipse coordinates stored as ratios - multiply by canvas dimensions
                ctx.beginPath()
                ctx.ellipse(
                  annotation.data.x * canvasWidth,
                  annotation.data.y * canvasHeight,
                  annotation.data.radiusX * canvasWidth,
                  annotation.data.radiusY * canvasHeight,
                  0,
                  0,
                  2 * Math.PI
                )
                ctx.stroke()
              } else if (annotation.type === 'line') {
                // Line coordinates stored as ratios - multiply by canvas dimensions
                ctx.beginPath()
                ctx.moveTo(annotation.data.x1 * canvasWidth, annotation.data.y1 * canvasHeight)
                ctx.lineTo(annotation.data.x2 * canvasWidth, annotation.data.y2 * canvasHeight)
                ctx.stroke()
              } else if (annotation.type === 'watermark') {
                // Watermark with rotation and opacity
                ctx.save()
                const x = annotation.data.x * canvasWidth
                const y = annotation.data.y * canvasHeight
                const fontSize = annotation.data.fontSize * canvasHeight
                
                ctx.translate(x, y)
                ctx.rotate((annotation.data.rotation * Math.PI) / 180)
                ctx.globalAlpha = annotation.data.opacity || 0.3
                
                const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
                const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
                const fontFamily = annotation.data.fontFamily || 'Arial'
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
                ctx.fillStyle = annotation.color
                ctx.textAlign = annotation.data.textAlign || 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(annotation.data.text, 0, 0)
                
                ctx.restore()
              }
            })
            
            // ✅ Draw watermark preview if watermark tool is active
            if (activeTool === 'watermark' && watermarkText && watermarkText.trim() !== '') {
              ctx.save()
              
              // Calculate position based on watermarkPosition
              let xRatio = 0.5
              let yRatio = 0.5
              
              switch (watermarkPosition) {
                case 'top-left':
                  xRatio = 0.2
                  yRatio = 0.2
                  break
                case 'top-right':
                  xRatio = 0.8
                  yRatio = 0.2
                  break
                case 'bottom-left':
                  xRatio = 0.2
                  yRatio = 0.8
                  break
                case 'bottom-right':
                  xRatio = 0.8
                  yRatio = 0.8
                  break
                case 'center':
                default:
                  xRatio = 0.5
                  yRatio = 0.5
                  break
              }
              
              const x = xRatio * canvasWidth
              const y = yRatio * canvasHeight
              const fontSizeRatio = watermarkFontSize / 800 // Convert to ratio
              const fontSizePixels = fontSizeRatio * canvasHeight // Scale based on canvas height
              
              ctx.translate(x, y)
              ctx.rotate((watermarkRotation * Math.PI) / 180)
              ctx.globalAlpha = watermarkOpacity
              ctx.font = `bold ${fontSizePixels}px Helvetica`
              ctx.fillStyle = watermarkColor
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(watermarkText, 0, 0)
              
              ctx.restore()
            }
          }
        }
      }
    }

    // Wait for PDF to render
    const timeoutId = setTimeout(updateCanvas, 150)
    return () => clearTimeout(timeoutId)
  }, [annotationsByPage, scale, pageNumber, activeTool, watermarkText, watermarkOpacity, watermarkRotation, watermarkFontSize, watermarkColor, watermarkPosition])

  return (
    <div ref={containerRef} className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  )
}

export function LivePDFEditor({ file, allFiles = [], onSave, onPreview }: LivePDFEditorProps) {
  // PDF state
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfPageDimensions, setPdfPageDimensions] = useState<{ width: number; height: number } | null>(null)
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  } | null>(null)
  
  // Custom pages export state
  const [showCustomPagesDialog, setShowCustomPagesDialog] = useState(false)
  const [customPagesInput, setCustomPagesInput] = useState('')
  
  // Tool state
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser' | 'text' | 'select' | 'rectangle' | 'ellipse' | 'line' | 'signature' | 'image' | 'watermark' | null>(null)
  const [toolColor, setToolColor] = useState('#000000')
  const [toolSize, setToolSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // ✅ Shape drawing state
  const [shapeStartPos, setShapeStartPos] = useState<{x: number, y: number} | null>(null)
  
  // ✅ Selection and movement state
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null) // 'tl', 'tr', 'bl', 'br'
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0})
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number}>({x: 0, y: 0})
  
  // ✅ Clean annotation state system with proper undo/redo stacks per page
  // Store annotations per page for perfect isolation
  const [annotationsByPage, setAnnotationsByPage] = useState<Record<number, Annotation[]>>({})
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  
  // ✅ Per-page history state: each page has its own undo/redo stacks
  const [history, setHistory] = useState<Record<number, {
    undoStack: Annotation[][]
    redoStack: Annotation[][]
  }>>({})
  
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([])
  const previousPageRef = useRef<number>(1)
  
  // Get current page's undo/redo stacks
  const undoStack = history[currentPage]?.undoStack || []
  const redoStack = history[currentPage]?.redoStack || []
  
  // Text state
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null)
  const [fontSize, setFontSize] = useState(16)
  const [isEditingText, setIsEditingText] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)
  
  // ✅ Advanced text formatting state
  const [fontFamily, setFontFamily] = useState('Arial')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  
  // ✅ Shape fill and opacity state
  const [fillColor, setFillColor] = useState('transparent')
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.3)
  
  // ✅ Watermark state
  const [watermarkText, setWatermarkText] = useState('WATERMARK')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3)
  const [watermarkRotation, setWatermarkRotation] = useState(45)
  const [watermarkFontSize, setWatermarkFontSize] = useState(48)
  const [watermarkColor, setWatermarkColor] = useState('#000000')
  const [watermarkPosition, setWatermarkPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center')
  
  // ✅ Focus and keyboard state
  const [canvasHasFocus, setCanvasHasFocus] = useState(false)
  const [copiedAnnotation, setCopiedAnnotation] = useState<Annotation | null>(null)
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null)
  
  // Refs
  const annotationsRef = useRef<Annotation[]>([])
  const eraserSavedRef = useRef<boolean>(false) // Track if we've saved to undo during eraser drag
  const pageCanvasRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // ✅ Keep annotations ref in sync for eraser hit detection
  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  // ✅ Smooth zoom with mouse wheel (Ctrl/Cmd + scroll)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelEvent = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        
        // Smooth zoom increments
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newScale = Math.min(Math.max(scale + delta, 0.1), 3)
        setScale(newScale)
        
        // Immediate feedback with requestAnimationFrame
        requestAnimationFrame(() => {
          if (overlayCanvasRef.current) {
            drawAllAnnotations()
          }
        })
      }
    }

    container.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelEvent)
  }, [scale])

  // Create PDF URL from file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  // Handle PDF load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully, pages:', numPages)
    setNumPages(numPages)
    setCurrentPage(1)
  }

  // Handle PDF load error
  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error)
  }

  // Handle page render success - sync canvas dimensions
  function onPageLoadSuccess() {
    console.log('Page rendered successfully')
    // Wait for PDF page canvas to be fully rendered
    setTimeout(() => {
      if (pageCanvasRef.current && overlayCanvasRef.current) {
        const pageCanvas = pageCanvasRef.current.querySelector('canvas')
        if (pageCanvas) {
          overlayCanvasRef.current.width = pageCanvas.width
          overlayCanvasRef.current.height = pageCanvas.height
          overlayCanvasRef.current.style.width = `${pageCanvas.offsetWidth}px`
          overlayCanvasRef.current.style.height = `${pageCanvas.offsetHeight}px`
          
          // ✅ Smooth redraw with requestAnimationFrame
          requestAnimationFrame(() => {
            drawAllAnnotations()
          })
        }
      }
    }, 150)
  }

  // ✅ Setup canvas dimensions when page/scale/rotation changes
  // This synchronizes the overlay canvas with the PDF page canvas
  useEffect(() => {
    const syncCanvasWithPDF = () => {
      if (!pageCanvasRef.current || !overlayCanvasRef.current) return
      
      const pageCanvas = pageCanvasRef.current.querySelector('canvas')
      if (!pageCanvas) return
      
      // Get PDF canvas dimensions
      const pdfWidth = pageCanvas.width
      const pdfHeight = pageCanvas.height
      const pdfDisplayWidth = pageCanvas.offsetWidth
      const pdfDisplayHeight = pageCanvas.offsetHeight
      
      // Sync overlay canvas dimensions
      overlayCanvasRef.current.width = pdfWidth
      overlayCanvasRef.current.height = pdfHeight
      overlayCanvasRef.current.style.width = `${pdfDisplayWidth}px`
      overlayCanvasRef.current.style.height = `${pdfDisplayHeight}px`
      
      // ✅ Use requestAnimationFrame for smooth redraw on zoom
      requestAnimationFrame(() => {
        drawAllAnnotations()
      })
    }
    
    // Initial sync
    const initialTimeout = setTimeout(syncCanvasWithPDF, 100)
    
    // Additional sync for zoom changes (React-PDF takes time to re-render)
    const zoomTimeout = setTimeout(syncCanvasWithPDF, 200)
    
    return () => {
      clearTimeout(initialTimeout)
      clearTimeout(zoomTimeout)
    }
  }, [currentPage, scale, rotation])

  // ✅ Auto-redraw canvas whenever annotations change
  // This ensures annotations are always visible after state updates
  useEffect(() => {
    if (overlayCanvasRef.current) {
      requestAnimationFrame(() => {
        drawAllAnnotations()
      })
    }
  }, [annotations, activeTool, watermarkText, watermarkOpacity, watermarkRotation, watermarkFontSize, watermarkColor, watermarkPosition])

  // ✅ Redraw selection box when selected annotation or zoom changes
  useEffect(() => {
    if (overlayCanvasRef.current && selectedAnnotationId) {
      requestAnimationFrame(() => {
        drawAllAnnotations()
      })
    }
  }, [selectedAnnotationId, scale, currentPage])

  // ✅ Smooth zoom updates - debounced redraw for performance
  useEffect(() => {
    // Additional redraw after scale stabilizes for perfect alignment
    const debounceTimeout = setTimeout(() => {
      if (overlayCanvasRef.current) {
        requestAnimationFrame(() => {
          drawAllAnnotations()
        })
      }
    }, 300)
    
    return () => clearTimeout(debounceTimeout)
  }, [scale])

  // ✅ Handle keyboard events for deleting selected annotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId && activeTool === 'select') {
        e.preventDefault()
        // Remove selected annotation
        const filteredAnnotations = annotations.filter(a => a.id !== selectedAnnotationId)
        
        // Save to undo stack before deleting
        saveToUndoStack()
        
        setAnnotations(filteredAnnotations)
        setSelectedAnnotationId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnnotationId, annotations, activeTool, currentPage, history])

  // ✅ CRITICAL: Save/Load annotations AND history when page changes
  useEffect(() => {
    const previousPage = previousPageRef.current
    
    // Save current page's annotations and history before switching
    if (previousPage !== currentPage) {
      if (annotations.length > 0) {
        setAnnotationsByPage(prev => ({
          ...prev,
          [previousPage]: [...annotations]
        }))
      }
      
      // Save current history stacks for previous page
      if (undoStack.length > 0 || redoStack.length > 0) {
        setHistory(prev => ({
          ...prev,
          [previousPage]: {
            undoStack: [...undoStack],
            redoStack: [...redoStack]
          }
        }))
      }
    }
    
    // Load new page's annotations and history
    const newPageAnnotations = annotationsByPage[currentPage] || []
    setAnnotations(newPageAnnotations)
    
    // Note: history[currentPage] is accessed via computed properties above
    // No need to manually reset - will automatically load from history state
    
    // Clear any active drawing state
    setCurrentPath([])
    setIsDrawing(false)
    setIsDragging(false)
    setIsResizing(false)
    setSelectedAnnotationId(null)
    
    // Update previous page ref
    previousPageRef.current = currentPage
    
    // Force canvas redraw after a brief delay to ensure page is rendered
    const redrawTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        if (overlayCanvasRef.current) {
          drawAllAnnotations()
        }
      })
    }, 150)
    
    return () => clearTimeout(redrawTimeout)
  }, [currentPage])

  // ✅ Main drawing function - redraws all annotations on the canvas
  // Called automatically when annotations change via useEffect above
  const drawAllAnnotations = () => {
    if (!overlayCanvasRef.current) return
    
    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas completely
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Filter annotations for current page only
    const pageAnnotations = annotations.filter(a => a.page === currentPage)
    
    // Draw each annotation with proper scaling
    pageAnnotations.forEach(annotation => {
      // Calculate scale factor to maintain constant visual size across zoom levels
      const scaleFactor = scale / annotation.scale
      
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = annotation.lineWidth * scaleFactor
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (annotation.type === 'pen') {
        // Pen paths are stored as ratios (0.0 to 1.0)
        // Multiply by current canvas dimensions to get pixel positions
        const renderScale = scale // Current zoom level
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
          x: p.x * canvasWidth,
          y: p.y * canvasHeight
        }))
        drawPath(ctx, scaledPath, false)
      } else if (annotation.type === 'highlighter') {
        ctx.globalAlpha = 0.3
        ctx.lineWidth = annotation.lineWidth * 3 * scaleFactor
        // Highlighter paths are stored as ratios (0.0 to 1.0)
        // Multiply by current canvas dimensions to get pixel positions
        const renderScale = scale
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
          x: p.x * canvasWidth,
          y: p.y * canvasHeight
        }))
        drawPath(ctx, scaledPath, false)
        ctx.globalAlpha = 1.0
      } else if (annotation.type === 'text') {
        const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
        const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
        const fontFamily = annotation.data.fontFamily || 'Arial'
        // fontSize is stored as ratio of canvas height - convert to pixels
        const fontSizePixels = annotation.data.fontSize * canvas.height
        ctx.font = `${fontStyle} ${fontWeight} ${fontSizePixels}px ${fontFamily}`
        ctx.fillStyle = annotation.color
        ctx.textAlign = annotation.data.textAlign || 'left'
        ctx.textBaseline = 'middle'  // Center text vertically at the Y position
        // Text coordinates stored as ratios - multiply by canvas dimensions
        ctx.fillText(
          annotation.data.text, 
          annotation.data.x * canvas.width, 
          annotation.data.y * canvas.height
        )
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'  // Reset to default
      } else if (annotation.type === 'rectangle') {
        // Rectangle coordinates stored as ratios - multiply by canvas dimensions
        ctx.strokeRect(
          annotation.data.x * canvas.width,
          annotation.data.y * canvas.height,
          annotation.data.width * canvas.width,
          annotation.data.height * canvas.height
        )
      } else if (annotation.type === 'ellipse') {
        // Ellipse coordinates stored as ratios - multiply by canvas dimensions
        ctx.beginPath()
        ctx.ellipse(
          annotation.data.x * canvas.width,
          annotation.data.y * canvas.height,
          annotation.data.radiusX * canvas.width,
          annotation.data.radiusY * canvas.height,
          0,
          0,
          2 * Math.PI
        )
        ctx.stroke()
      } else if (annotation.type === 'line') {
        // Line coordinates stored as ratios - multiply by canvas dimensions
        ctx.beginPath()
        ctx.moveTo(annotation.data.x1 * canvas.width, annotation.data.y1 * canvas.height)
        ctx.lineTo(annotation.data.x2 * canvas.width, annotation.data.y2 * canvas.height)
        ctx.stroke()
      } else if (annotation.type === 'watermark') {
        // Watermark with rotation and opacity
        ctx.save()
        const x = annotation.data.x * canvas.width
        const y = annotation.data.y * canvas.height
        const fontSize = annotation.data.fontSize * canvas.height
        
        ctx.translate(x, y)
        ctx.rotate((annotation.data.rotation * Math.PI) / 180)
        ctx.globalAlpha = annotation.data.opacity || 0.3
        
        const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
        const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
        const fontFamily = annotation.data.fontFamily || 'Arial'
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.fillStyle = annotation.color
        ctx.textAlign = annotation.data.textAlign || 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(annotation.data.text, 0, 0)
        
        ctx.restore()
      }
    })
    
    // ✅ Draw selection box for selected annotation
    if (selectedAnnotationId) {
      const selectedAnnotation = pageAnnotations.find(a => a.id === selectedAnnotationId)
      if (selectedAnnotation) {
        const scaleFactor = scale / selectedAnnotation.scale
        const bounds = getAnnotationBounds(selectedAnnotation, scaleFactor)
        drawSelectionBox(ctx, bounds)
      }
    }
    
    // ✅ Draw watermark if watermark tool is active
    if (activeTool === 'watermark' && watermarkText) {
      drawWatermark(ctx, canvas.width, canvas.height)
    }
    
    ctx.restore()
  }

  // ✅ Calculate bounding box for any annotation type
  const getAnnotationBounds = (annotation: Annotation, scaleFactor: number) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
    
    if (annotation.bounds) {
      return {
        x: annotation.bounds.x * canvas.width,
        y: annotation.bounds.y * canvas.height,
        width: annotation.bounds.width * canvas.width,
        height: annotation.bounds.height * canvas.height
      }
    }

    // Calculate bounds for different annotation types
    if (annotation.type === 'text') {
      const x = annotation.data.x * canvas.width
      const y = annotation.data.y * canvas.height
      // fontSize is stored as ratio - convert to pixels
      const fontSize = annotation.data.fontSize * canvas.height
      const textWidth = annotation.data.text.length * fontSize * 0.6
      // Text is rendered with middle baseline, so bounds extend half fontSize above and below
      return {
        x: x - 5,
        y: y - fontSize / 2 - 5,
        width: textWidth + 10,
        height: fontSize + 10
      }
    } else if (annotation.type === 'pen' || annotation.type === 'highlighter') {
      // Pen/highlighter paths stored as ratios - multiply by canvas dimensions
      const canvas = overlayCanvasRef.current
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
      
      const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height
      }))
      const xs = scaledPath.map((p: {x: number}) => p.x)
      const ys = scaledPath.map((p: {y: number}) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return {
        x: minX - 10,
        y: minY - 10,
        width: maxX - minX + 20,
        height: maxY - minY + 20
      }
    } else if (annotation.type === 'rectangle') {
      const canvas = overlayCanvasRef.current
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
      return {
        x: annotation.data.x * canvas.width - 5,
        y: annotation.data.y * canvas.height - 5,
        width: annotation.data.width * canvas.width + 10,
        height: annotation.data.height * canvas.height + 10
      }
    } else if (annotation.type === 'ellipse') {
      const canvas = overlayCanvasRef.current
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
      const cx = annotation.data.x * canvas.width
      const cy = annotation.data.y * canvas.height
      const rx = annotation.data.radiusX * canvas.width
      const ry = annotation.data.radiusY * canvas.height
      return {
        x: cx - rx - 5,
        y: cy - ry - 5,
        width: rx * 2 + 10,
        height: ry * 2 + 10
      }
    } else if (annotation.type === 'line') {
      const canvas = overlayCanvasRef.current
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
      const x1 = annotation.data.x1 * canvas.width
      const y1 = annotation.data.y1 * canvas.height
      const x2 = annotation.data.x2 * canvas.width
      const y2 = annotation.data.y2 * canvas.height
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)
      return {
        x: minX - 10,
        y: minY - 10,
        width: maxX - minX + 20,
        height: maxY - minY + 20
      }
    } else if (annotation.type === 'watermark') {
      const canvas = overlayCanvasRef.current
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0 }
      const x = annotation.data.x * canvas.width
      const y = annotation.data.y * canvas.height
      const fontSize = annotation.data.fontSize * canvas.height
      const textWidth = annotation.data.text.length * fontSize * 0.6
      return {
        x: x - textWidth / 2 - 5,
        y: y - fontSize / 2 - 5,
        width: textWidth + 10,
        height: fontSize + 10
      }
    }

    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // ✅ Draw selection box with dashed outline and resize handles
  const drawSelectionBox = (ctx: CanvasRenderingContext2D, bounds: any) => {
    ctx.save()
    ctx.strokeStyle = '#3b82f6' // Blue
    ctx.lineWidth = 2
    ctx.setLineDash([4, 2])
    
    // Draw bounding box
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    
    // Draw resize handles (small squares at corners)
    ctx.setLineDash([])
    ctx.fillStyle = '#3b82f6'
    const handleSize = 8
    
    // Top-left
    ctx.fillRect(bounds.x - handleSize / 2, bounds.y - handleSize / 2, handleSize, handleSize)
    // Top-right
    ctx.fillRect(bounds.x + bounds.width - handleSize / 2, bounds.y - handleSize / 2, handleSize, handleSize)
    // Bottom-left
    ctx.fillRect(bounds.x - handleSize / 2, bounds.y + bounds.height - handleSize / 2, handleSize, handleSize)
    // Bottom-right
    ctx.fillRect(bounds.x + bounds.width - handleSize / 2, bounds.y + bounds.height - handleSize / 2, handleSize, handleSize)
    
    ctx.restore()
  }

  // ✅ Draw watermark on canvas
  const drawWatermark = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    ctx.save()
    
    // Set watermark properties
    ctx.globalAlpha = watermarkOpacity
    ctx.fillStyle = watermarkColor
    const fontSizeRatio = watermarkFontSize / 800 // Convert to ratio (assuming 800px reference height)
    const fontSizePixels = fontSizeRatio * canvasHeight // Scale based on canvas height
    ctx.font = `bold ${fontSizePixels}px Helvetica`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Calculate position based on selection
    let x = canvasWidth / 2
    let y = canvasHeight / 2
    
    switch (watermarkPosition) {
      case 'top-left':
        x = canvasWidth * 0.2
        y = canvasHeight * 0.2
        break
      case 'top-right':
        x = canvasWidth * 0.8
        y = canvasHeight * 0.2
        break
      case 'bottom-left':
        x = canvasWidth * 0.2
        y = canvasHeight * 0.8
        break
      case 'bottom-right':
        x = canvasWidth * 0.8
        y = canvasHeight * 0.8
        break
      case 'center':
      default:
        x = canvasWidth / 2
        y = canvasHeight / 2
        break
    }
    
    // Apply rotation
    ctx.translate(x, y)
    ctx.rotate((watermarkRotation * Math.PI) / 180)
    
    // Draw the watermark text
    ctx.fillText(watermarkText, 0, 0)
    
    ctx.restore()
  }

  // ✅ Check if position is within annotation bounds
  const isPositionInAnnotation = (pos: {x: number, y: number}, annotation: Annotation, scaleFactor: number): boolean => {
    const bounds = getAnnotationBounds(annotation, scaleFactor)
    return pos.x >= bounds.x && 
           pos.x <= bounds.x + bounds.width &&
           pos.y >= bounds.y && 
           pos.y <= bounds.y + bounds.height
  }

  // ✅ Check if position is on a resize handle
  const getResizeHandle = (pos: {x: number, y: number}, bounds: any): string | null => {
    const handleSize = 8
    const tolerance = 4
    
    // Top-left
    if (Math.abs(pos.x - bounds.x) < handleSize + tolerance && 
        Math.abs(pos.y - bounds.y) < handleSize + tolerance) {
      return 'tl'
    }
    // Top-right
    if (Math.abs(pos.x - (bounds.x + bounds.width)) < handleSize + tolerance && 
        Math.abs(pos.y - bounds.y) < handleSize + tolerance) {
      return 'tr'
    }
    // Bottom-left
    if (Math.abs(pos.x - bounds.x) < handleSize + tolerance && 
        Math.abs(pos.y - (bounds.y + bounds.height)) < handleSize + tolerance) {
      return 'bl'
    }
    // Bottom-right
    if (Math.abs(pos.x - (bounds.x + bounds.width)) < handleSize + tolerance && 
        Math.abs(pos.y - (bounds.y + bounds.height)) < handleSize + tolerance) {
      return 'br'
    }
    
    return null
  }

  // ✅ Find annotation at click position (reverse order for top-most)
  const findAnnotationAtPosition = (pos: {x: number, y: number}): Annotation | null => {
    const pageAnnotations = annotations.filter(a => a.page === currentPage)
    
    for (let i = pageAnnotations.length - 1; i >= 0; i--) {
      const annotation = pageAnnotations[i]
      const scaleFactor = scale / annotation.scale
      
      if (isPositionInAnnotation(pos, annotation, scaleFactor)) {
        return annotation
      }
    }
    
    return null
  }

  // ✅ Helper function to draw annotations for a specific page on a given canvas
  const drawAnnotationsForPage = (canvas: HTMLCanvasElement, pageNumber: number) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Filter annotations for this specific page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber)
    
    // Draw each annotation
    pageAnnotations.forEach(annotation => {
      const scaleFactor = scale / annotation.scale
      
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = annotation.lineWidth * scaleFactor
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (annotation.type === 'pen') {
        const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
          x: p.x * scaleFactor,
          y: p.y * scaleFactor
        }))
        drawPath(ctx, scaledPath, false)
      } else if (annotation.type === 'highlighter') {
        ctx.globalAlpha = 0.3
        ctx.lineWidth = annotation.lineWidth * 3 * scaleFactor
        const scaledPath = annotation.data.path.map((p: {x: number, y: number}) => ({
          x: p.x * scaleFactor,
          y: p.y * scaleFactor
        }))
        drawPath(ctx, scaledPath, false)
        ctx.globalAlpha = 1.0
      } else if (annotation.type === 'text') {
        const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
        const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
        const fontFamily = annotation.data.fontFamily || 'Arial'
        ctx.font = `${fontStyle} ${fontWeight} ${annotation.data.fontSize * scaleFactor}px ${fontFamily}`
        ctx.fillStyle = annotation.color
        ctx.textAlign = annotation.data.textAlign || 'left'
        ctx.fillText(
          annotation.data.text, 
          annotation.data.x * scaleFactor, 
          annotation.data.y * scaleFactor
        )
        ctx.textAlign = 'left'
      } else if (annotation.type === 'rectangle') {
        ctx.strokeRect(
          annotation.data.x * scaleFactor,
          annotation.data.y * scaleFactor,
          annotation.data.width * scaleFactor,
          annotation.data.height * scaleFactor
        )
      } else if (annotation.type === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(
          annotation.data.x * scaleFactor,
          annotation.data.y * scaleFactor,
          annotation.data.radiusX * scaleFactor,
          annotation.data.radiusY * scaleFactor,
          0,
          0,
          2 * Math.PI
        )
        ctx.stroke()
      } else if (annotation.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(annotation.data.x1 * scaleFactor, annotation.data.y1 * scaleFactor)
        ctx.lineTo(annotation.data.x2 * scaleFactor, annotation.data.y2 * scaleFactor)
        ctx.stroke()
      }
    })
  }

  const drawPath = (ctx: CanvasRenderingContext2D, path: {x: number, y: number}[], close = false) => {
    if (path.length < 2) return
    
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    
    if (close) ctx.closePath()
    ctx.stroke()
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 20
    const angle = Math.atan2(toY - fromY, toX - fromX)
    
    // Draw line
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
    
    // Draw arrow head
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  // ✅ Helper functions for undo/redo stack management (per-page)
  const saveToUndoStack = () => {
    // Save current annotations to undo stack and clear redo stack
    setHistory(prev => ({
      ...prev,
      [currentPage]: {
        undoStack: [...(prev[currentPage]?.undoStack || []), [...annotations]],
        redoStack: [] // Clear redo when new action is taken
      }
    }))
  }

  const saveToRedoStack = (state: Annotation[]) => {
    setHistory(prev => ({
      ...prev,
      [currentPage]: {
        undoStack: prev[currentPage]?.undoStack || [],
        redoStack: [...(prev[currentPage]?.redoStack || []), state]
      }
    }))
  }

  const popFromUndoStack = (): Annotation[] | null => {
    const currentUndoStack = history[currentPage]?.undoStack || []
    if (currentUndoStack.length === 0) return null
    
    const previousState = currentUndoStack[currentUndoStack.length - 1]
    
    // Update history by removing last undo item
    setHistory(prev => ({
      ...prev,
      [currentPage]: {
        undoStack: currentUndoStack.slice(0, -1),
        redoStack: prev[currentPage]?.redoStack || []
      }
    }))
    
    return previousState
  }

  const popFromRedoStack = (): Annotation[] | null => {
    const currentRedoStack = history[currentPage]?.redoStack || []
    if (currentRedoStack.length === 0) return null
    
    const nextState = currentRedoStack[currentRedoStack.length - 1]
    
    // Update history by removing last redo item
    setHistory(prev => ({
      ...prev,
      [currentPage]: {
        undoStack: prev[currentPage]?.undoStack || [],
        redoStack: currentRedoStack.slice(0, -1)
      }
    }))
    
    return nextState
  }

  // ✅ Helper function to measure text accurately using canvas
  const measureText = (text: string, fontSizeVal: number, fontFamilyVal: string, isBoldVal: boolean, isItalicVal: boolean) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { width: text.length * fontSizeVal * 0.6, height: fontSizeVal }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return { width: text.length * fontSizeVal * 0.6, height: fontSizeVal }
    
    const fontWeight = isBoldVal ? 'bold' : 'normal'
    const fontStyle = isItalicVal ? 'italic' : 'normal'
    ctx.font = `${fontStyle} ${fontWeight} ${fontSizeVal}px ${fontFamilyVal}`
    
    const metrics = ctx.measureText(text)
    return {
      width: metrics.width,
      height: fontSizeVal * 1.2 // Add some padding for line height
    }
  }

  // ✅ Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in text input or not focused on canvas
      if (editingAnnotationId || isEditingText || !canvasHasFocus) return
      
      // Tool shortcuts (single key, no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Select tool: S
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          setActiveTool(activeTool === 'select' ? null : 'select')
          setSelectedAnnotationId(null)
          return
        }
        
        // Pen tool: P
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault()
          setActiveTool(activeTool === 'pen' ? null : 'pen')
          setSelectedAnnotationId(null)
          return
        }
        
        // Highlighter: H
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault()
          setActiveTool(activeTool === 'highlighter' ? null : 'highlighter')
          setSelectedAnnotationId(null)
          return
        }
        
        // Text: T
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault()
          setActiveTool(activeTool === 'text' ? null : 'text')
          setSelectedAnnotationId(null)
          return
        }
        
        // Rectangle: R
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          setActiveTool(activeTool === 'rectangle' ? null : 'rectangle')
          setSelectedAnnotationId(null)
          return
        }
        
        // Circle/Ellipse: C
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault()
          setActiveTool(activeTool === 'ellipse' ? null : 'ellipse')
          setSelectedAnnotationId(null)
          return
        }
        
        // Line: L
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault()
          setActiveTool(activeTool === 'line' ? null : 'line')
          setSelectedAnnotationId(null)
          return
        }
        
        // Eraser: E
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault()
          setActiveTool(activeTool === 'eraser' ? null : 'eraser')
          setSelectedAnnotationId(null)
          return
        }
        
        // Watermark: W
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault()
          setActiveTool(activeTool === 'watermark' ? null : 'watermark')
          setSelectedAnnotationId(null)
          return
        }
      }
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        handleRedo()
        return
      }
      
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault()
        handleDeleteSelected()
        return
      }
      
      // Copy: Ctrl+C (only when annotation is selected)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedAnnotationId) {
        e.preventDefault()
        handleCopy()
        return
      }
      
      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedAnnotation) {
        e.preventDefault()
        handlePaste()
        return
      }
      
      // Zoom in: Ctrl + +
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        handleZoomIn()
        return
      }
      
      // Zoom out: Ctrl + -
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
        return
      }
      
      // Arrow keys: Nudge selected annotation
      if (selectedAnnotationId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        handleNudge(e.key)
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnnotationId, copiedAnnotation, canvasHasFocus, isEditingText, editingAnnotationId, annotations, history])

  // Mouse event handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  // ✅ Mouse event handlers - Updated for selection support
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return
    
    const pos = getMousePos(e)
    
    // ✅ SELECT TOOL: Click to select, drag to move, or resize
    if (activeTool === 'select') {
      const clickedAnnotation = findAnnotationAtPosition(pos)
      
      if (clickedAnnotation) {
        const scaleFactor = scale / clickedAnnotation.scale
        const bounds = getAnnotationBounds(clickedAnnotation, scaleFactor)
        const handle = getResizeHandle(pos, bounds)
        
        if (handle) {
          // Start resizing - save to undo first
          saveToUndoStack()
          setSelectedAnnotationId(clickedAnnotation.id)
          setIsResizing(true)
          setResizeHandle(handle)
          setDragStartPos(pos)
        } else if (isPositionInAnnotation(pos, clickedAnnotation, scaleFactor)) {
          // Start dragging - save to undo first
          saveToUndoStack()
          setSelectedAnnotationId(clickedAnnotation.id)
          setIsDragging(true)
          
          const canvas = overlayCanvasRef.current
          if (!canvas) return
          
          // Calculate offset for smooth dragging using ratios
          if (clickedAnnotation.type === 'text' || clickedAnnotation.type === 'watermark') {
            setDragOffset({
              x: pos.x - (clickedAnnotation.data.x * canvas.width),
              y: pos.y - (clickedAnnotation.data.y * canvas.height)
            })
          } else if (clickedAnnotation.type === 'pen' || clickedAnnotation.type === 'highlighter') {
            const firstPoint = clickedAnnotation.data.path[0]
            setDragOffset({
              x: pos.x - (firstPoint.x * canvas.width),
              y: pos.y - (firstPoint.y * canvas.height)
            })
          }
        }
      } else {
        // Clicked empty space - deselect
        setSelectedAnnotationId(null)
      }
      return
    }
    
    // TEXT TOOL: Click to add text
    if (activeTool === 'text') {
      setTextPosition(pos)
      setTextInput('')
      setIsEditingText(true)
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }
    
    // ✅ SHAPE TOOLS: Start drawing rectangle, ellipse, or line
    if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line') {
      setIsDrawing(true)
      setShapeStartPos(pos)
      return
    }
    
    // Start drawing for pen/highlighter/eraser
    setIsDrawing(true)
    
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPath([pos])
    } else if (activeTool === 'eraser') {
      // ✅ Save to undo stack ONCE at start of eraser drag
      eraserSavedRef.current = false
      
      const canvas = overlayCanvasRef.current
      if (!canvas) return
      
      const eraserRadius = toolSize * 8
      
      // Use ref to get latest state for immediate hit detection
      const currentAnnotations = annotationsRef.current
      const remainingAnnotations = currentAnnotations.filter(annotation => {
        if (annotation.page !== currentPage) return true
        
        // Check pen/highlighter paths
        if (annotation.type === 'pen' || annotation.type === 'highlighter') {
          return !annotation.data.path.some((point: {x: number, y: number}) => {
            // Convert normalized path coordinates to canvas pixels
            const pointX = point.x * canvas.width
            const pointY = point.y * canvas.height
            const distance = Math.sqrt(
              Math.pow(pointX - pos.x, 2) + Math.pow(pointY - pos.y, 2)
            )
            return distance < eraserRadius
          })
        }
        
        // Check text annotations
        if (annotation.type === 'text') {
          const textX = annotation.data.x * canvas.width
          const textY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(textX - pos.x, 2) + Math.pow(textY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        // Check rectangle annotations
        if (annotation.type === 'rectangle') {
          const rectX = annotation.data.x * canvas.width
          const rectY = annotation.data.y * canvas.height
          const rectW = annotation.data.width * canvas.width
          const rectH = annotation.data.height * canvas.height
          const centerX = rectX + rectW / 2
          const centerY = rectY + rectH / 2
          const distance = Math.sqrt(
            Math.pow(centerX - pos.x, 2) + Math.pow(centerY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        // Check ellipse annotations
        if (annotation.type === 'ellipse') {
          const ellipseX = annotation.data.x * canvas.width
          const ellipseY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(ellipseX - pos.x, 2) + Math.pow(ellipseY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        // Check line annotations
        if (annotation.type === 'line') {
          const x1 = annotation.data.x1 * canvas.width
          const y1 = annotation.data.y1 * canvas.height
          const x2 = annotation.data.x2 * canvas.width
          const y2 = annotation.data.y2 * canvas.height
          const centerX = (x1 + x2) / 2
          const centerY = (y1 + y2) / 2
          const distance = Math.sqrt(
            Math.pow(centerX - pos.x, 2) + Math.pow(centerY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        // Check watermark annotations
        if (annotation.type === 'watermark') {
          const watermarkX = annotation.data.x * canvas.width
          const watermarkY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(watermarkX - pos.x, 2) + Math.pow(watermarkY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        return true
      })
      
      // If something was erased, update state immediately with undo support
      if (remainingAnnotations.length !== currentAnnotations.length) {
        if (!eraserSavedRef.current) {
          // Save to undo stack only once per eraser action
          saveToUndoStack()
          eraserSavedRef.current = true
        }
        
        // Update annotations immediately - redraw via requestAnimationFrame
        setAnnotations(remainingAnnotations)
        requestAnimationFrame(() => {
          if (overlayCanvasRef.current) {
            drawAllAnnotations()
          }
        })
      }
    }
  }

  // ✅ Handle mouse movement for dragging, resizing, and drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    // ✅ SELECT TOOL: Handle dragging or resizing
    if (activeTool === 'select') {
      if (isDragging && selectedAnnotationId) {
        const annotation = annotations.find(a => a.id === selectedAnnotationId)
        if (!annotation) return
        
        const canvas = overlayCanvasRef.current
        if (!canvas) return
        
        // Convert canvas pixels to ratios
        const newX = (pos.x - dragOffset.x) / canvas.width
        const newY = (pos.y - dragOffset.y) / canvas.height
        
        const updatedAnnotations = annotations.map(a => {
          if (a.id === selectedAnnotationId) {
            if (a.type === 'text' || a.type === 'watermark') {
              return {
                ...a,
                data: {
                  ...a.data,
                  x: newX,
                  y: newY
                }
              }
            } else if (a.type === 'pen' || a.type === 'highlighter') {
              const firstPoint = a.data.path[0]
              const deltaX = newX - firstPoint.x
              const deltaY = newY - firstPoint.y
              
              return {
                ...a,
                data: {
                  ...a.data,
                  path: a.data.path.map((p: {x: number, y: number}) => ({
                    x: p.x + deltaX,
                    y: p.y + deltaY
                  }))
                }
              }
            }
          }
          return a
        })
        
        setAnnotations(updatedAnnotations)
        return
      } else if (isResizing && selectedAnnotationId && resizeHandle) {
        const annotation = annotations.find(a => a.id === selectedAnnotationId)
        if (!annotation || annotation.type !== 'text') return
        
        const canvas = overlayCanvasRef.current
        if (!canvas) return
        
        const scaleFactor = scale / annotation.scale
        const deltaX = (pos.x - dragStartPos.x) / scaleFactor
        const deltaY = (pos.y - dragStartPos.y) / scaleFactor
        
        const updatedAnnotations = annotations.map(a => {
          if (a.id === selectedAnnotationId && a.type === 'text') {
            // Calculate diagonal distance for resize
            let delta = 0
            
            if (resizeHandle === 'br') {
              // Bottom-right: increase with positive drag
              delta = (deltaX + deltaY) / 2
            } else if (resizeHandle === 'tr') {
              // Top-right: increase with right and up drag
              delta = (deltaX - deltaY) / 2
            } else if (resizeHandle === 'bl') {
              // Bottom-left: increase with left and down drag
              delta = (-deltaX + deltaY) / 2
            } else if (resizeHandle === 'tl') {
              // Top-left: increase with left and up drag
              delta = (-deltaX - deltaY) / 2
            }
            
            // Convert delta to font size change (delta is in canvas pixels, fontSize is ratio)
            const fontSizeDelta = delta / canvas.height
            const newFontSize = Math.max(8 / canvas.height, Math.min(72 / canvas.height, a.data.fontSize + fontSizeDelta))
            const newFontSizePixels = newFontSize * canvas.height
            
            const textMetrics = measureText(a.data.text, newFontSizePixels, a.data.fontFamily, a.data.isBold, a.data.isItalic)
            
            return {
              ...a,
              data: {
                ...a.data,
                fontSize: newFontSize
              },
              bounds: {
                x: a.data.x,
                y: a.data.y - (newFontSize / 2),
                width: textMetrics.width / canvas.width,
                height: newFontSize
              }
            }
          }
          return a
        })
        
        setAnnotations(updatedAnnotations)
        setDragStartPos(pos) // Update for smooth continuous resizing
        return
      }
      
      // Update cursor based on hover position
      if (selectedAnnotationId && overlayCanvasRef.current) {
        const annotation = annotations.find(a => a.id === selectedAnnotationId)
        if (annotation) {
          const scaleFactor = scale / annotation.scale
          const bounds = getAnnotationBounds(annotation, scaleFactor)
          const handle = getResizeHandle(pos, bounds)
          
          if (handle) {
            overlayCanvasRef.current.style.cursor = handle === 'tl' || handle === 'br' ? 'nwse-resize' : 'nesw-resize'
          } else if (isPositionInAnnotation(pos, annotation, scaleFactor)) {
            overlayCanvasRef.current.style.cursor = 'move'
          } else {
            overlayCanvasRef.current.style.cursor = 'default'
          }
        }
      }
      
      return
    }
    
    if (!isDrawing || !activeTool) return
    
    // PEN/HIGHLIGHTER TOOL: Draw in real-time
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      // Add point to current path
      const newPath = [...currentPath, pos]
      setCurrentPath(newPath)
      
      // ✅ Draw current path in real-time while annotations auto-redraw in background
      const canvas = overlayCanvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        // Clear and redraw all saved annotations
        drawAllAnnotations()
        
        // Draw current path being created
        if (newPath.length > 1) {
          ctx.strokeStyle = toolColor
          ctx.lineWidth = activeTool === 'highlighter' ? toolSize * 3 : toolSize
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          if (activeTool === 'highlighter') {
            ctx.globalAlpha = 0.3
          }
          
          ctx.beginPath()
          ctx.moveTo(newPath[0].x, newPath[0].y)
          for (let i = 1; i < newPath.length; i++) {
            ctx.lineTo(newPath[i].x, newPath[i].y)
          }
          ctx.stroke()
          
          ctx.globalAlpha = 1.0
        }
      }
    } else if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line') {
      // ✅ SHAPE DRAWING: Show preview while dragging
      if (!shapeStartPos) return
      
      const canvas = overlayCanvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        // Clear and redraw all saved annotations
        drawAllAnnotations()
        
        // Draw shape preview
        ctx.strokeStyle = toolColor
        ctx.lineWidth = toolSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash([5, 5]) // Dashed preview
        
        if (activeTool === 'rectangle') {
          const width = pos.x - shapeStartPos.x
          const height = pos.y - shapeStartPos.y
          ctx.strokeRect(shapeStartPos.x, shapeStartPos.y, width, height)
        } else if (activeTool === 'ellipse') {
          const radiusX = Math.abs(pos.x - shapeStartPos.x) / 2
          const radiusY = Math.abs(pos.y - shapeStartPos.y) / 2
          const centerX = shapeStartPos.x + (pos.x - shapeStartPos.x) / 2
          const centerY = shapeStartPos.y + (pos.y - shapeStartPos.y) / 2
          
          ctx.beginPath()
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
        } else if (activeTool === 'line') {
          ctx.beginPath()
          ctx.moveTo(shapeStartPos.x, shapeStartPos.y)
          ctx.lineTo(pos.x, pos.y)
          ctx.stroke()
        }
        
        ctx.setLineDash([]) // Reset dash
      }
    } else if (activeTool === 'eraser') {
      // ✅ Use ref for latest state during drag to avoid lag
      const canvas = overlayCanvasRef.current
      if (!canvas) return
      
      const eraserRadius = toolSize * 8
      const currentAnnotations = annotationsRef.current
      
      const remainingAnnotations = currentAnnotations.filter(annotation => {
        if (annotation.page !== currentPage) return true
        
        if (annotation.type === 'pen' || annotation.type === 'highlighter') {
          return !annotation.data.path.some((point: {x: number, y: number}) => {
            // Convert normalized path coordinates to canvas pixels
            const pointX = point.x * canvas.width
            const pointY = point.y * canvas.height
            const distance = Math.sqrt(
              Math.pow(pointX - pos.x, 2) + Math.pow(pointY - pos.y, 2)
            )
            return distance < eraserRadius
          })
        } else if (annotation.type === 'text') {
          const textX = annotation.data.x * canvas.width
          const textY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(textX - pos.x, 2) + Math.pow(textY - pos.y, 2)
          )
          return distance > eraserRadius
        } else if (annotation.type === 'rectangle') {
          const rectX = annotation.data.x * canvas.width
          const rectY = annotation.data.y * canvas.height
          const rectW = annotation.data.width * canvas.width
          const rectH = annotation.data.height * canvas.height
          const centerX = rectX + rectW / 2
          const centerY = rectY + rectH / 2
          const distance = Math.sqrt(
            Math.pow(centerX - pos.x, 2) + Math.pow(centerY - pos.y, 2)
          )
          return distance > eraserRadius
        } else if (annotation.type === 'ellipse') {
          const ellipseX = annotation.data.x * canvas.width
          const ellipseY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(ellipseX - pos.x, 2) + Math.pow(ellipseY - pos.y, 2)
          )
          return distance > eraserRadius
        } else if (annotation.type === 'line') {
          const x1 = annotation.data.x1 * canvas.width
          const y1 = annotation.data.y1 * canvas.height
          const x2 = annotation.data.x2 * canvas.width
          const y2 = annotation.data.y2 * canvas.height
          const centerX = (x1 + x2) / 2
          const centerY = (y1 + y2) / 2
          const distance = Math.sqrt(
            Math.pow(centerX - pos.x, 2) + Math.pow(centerY - pos.y, 2)
          )
          return distance > eraserRadius
        } else if (annotation.type === 'watermark') {
          const watermarkX = annotation.data.x * canvas.width
          const watermarkY = annotation.data.y * canvas.height
          const distance = Math.sqrt(
            Math.pow(watermarkX - pos.x, 2) + Math.pow(watermarkY - pos.y, 2)
          )
          return distance > eraserRadius
        }
        
        return true
      })
      
      // ✅ If something was erased during drag, update immediately with smooth redraw
      if (remainingAnnotations.length !== currentAnnotations.length) {
        setAnnotations(remainingAnnotations)
        requestAnimationFrame(() => {
          if (overlayCanvasRef.current) {
            drawAllAnnotations()
          }
        })
      }
    }
  }

  // ✅ Handle mouse up - finish dragging, resizing, or drawing
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // ✅ SELECT TOOL: Finish dragging or resizing
    if (activeTool === 'select') {
      if (isDragging || isResizing) {
        setIsDragging(false)
        setIsResizing(false)
        setResizeHandle(null)
        
        // Update bounds after drag/resize for text annotations
        const canvas = overlayCanvasRef.current
        const updatedAnnotations = annotations.map(a => {
          if (a.id === selectedAnnotationId && a.type === 'text' && canvas) {
            // fontSize is stored as ratio - convert to pixels for measurement
            const fontSizePixels = a.data.fontSize * canvas.height
            const textMetrics = measureText(a.data.text, fontSizePixels, a.data.fontFamily, a.data.isBold, a.data.isItalic)
            return {
              ...a,
              bounds: {
                x: a.data.x,
                y: a.data.y - (fontSizePixels / (2 * canvas.height)),  // Half font size above center
                width: textMetrics.width / canvas.width,
                height: fontSizePixels / canvas.height
              }
            }
          }
          return a
        })
        
        setAnnotations(updatedAnnotations)
        
        requestAnimationFrame(() => {
          if (overlayCanvasRef.current) {
            drawAllAnnotations()
          }
        })
      }
      return
    }
    
    if (!isDrawing || !activeTool) return
    
    setIsDrawing(false)
    
    // Reset eraser saved flag when mouse up
    if (activeTool === 'eraser') {
      eraserSavedRef.current = false
      return
    }
    
    // ✅ Complete shape drawing (rectangle, ellipse, line)
    if ((activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line') && shapeStartPos) {
      const pos = getMousePos(e)
      
      if (activeTool === 'rectangle') {
        const width = pos.x - shapeStartPos.x
        const height = pos.y - shapeStartPos.y
        
        // Only create if shape has meaningful size
        if (Math.abs(width) > 5 && Math.abs(height) > 5) {
          const canvas = overlayCanvasRef.current
          if (!canvas) return
          
          // Convert to ratios for resolution independence
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'rectangle',
            page: currentPage,
            data: {
              x: Math.min(shapeStartPos.x, pos.x) / canvas.width,
              y: Math.min(shapeStartPos.y, pos.y) / canvas.height,
              width: Math.abs(width) / canvas.width,
              height: Math.abs(height) / canvas.height
            },
            color: toolColor,
            lineWidth: toolSize,
            scale: scale
          }
          addAnnotation(newAnnotation)
        }
      } else if (activeTool === 'ellipse') {
        const radiusX = Math.abs(pos.x - shapeStartPos.x) / 2
        const radiusY = Math.abs(pos.y - shapeStartPos.y) / 2
        
        if (radiusX > 5 && radiusY > 5) {
          const centerX = (shapeStartPos.x + pos.x) / 2
          const centerY = (shapeStartPos.y + pos.y) / 2
          
          const canvas = overlayCanvasRef.current
          if (!canvas) return
          
          // Convert to ratios for resolution independence
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'ellipse',
            page: currentPage,
            data: {
              x: centerX / canvas.width,
              y: centerY / canvas.height,
              radiusX: radiusX / canvas.width,
              radiusY: radiusY / canvas.height
            },
            color: toolColor,
            lineWidth: toolSize,
            scale: scale
          }
          addAnnotation(newAnnotation)
        }
      } else if (activeTool === 'line') {
        const distance = Math.sqrt(
          Math.pow(pos.x - shapeStartPos.x, 2) + Math.pow(pos.y - shapeStartPos.y, 2)
        )
        
        if (distance > 5) {
          const canvas = overlayCanvasRef.current
          if (!canvas) return
          
          // Convert to ratios for resolution independence
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'line',
            page: currentPage,
            data: {
              x1: shapeStartPos.x / canvas.width,
              y1: shapeStartPos.y / canvas.height,
              x2: pos.x / canvas.width,
              y2: pos.y / canvas.height
            },
            color: toolColor,
            lineWidth: toolSize,
            scale: scale
          }
          addAnnotation(newAnnotation)
        }
      }
      
      setShapeStartPos(null)
      return
    }
    
    // Complete pen/highlighter drawing
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      if (currentPath.length > 1) {
        const canvas = overlayCanvasRef.current
        if (!canvas) return
        
        // Canvas dimensions at current scale
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        
        // CRITICAL FIX: Store coordinates as ratios (0.0 to 1.0) instead of absolute pixels
        // This makes them resolution-independent and PDF-size-independent
        const normalizedPath = currentPath.map(point => ({
          x: point.x / canvasWidth,   // Convert to ratio: 0.0 = left edge, 1.0 = right edge
          y: point.y / canvasHeight   // Convert to ratio: 0.0 = top edge, 1.0 = bottom edge
        }))
        
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: activeTool,
          page: currentPage,
          data: { path: normalizedPath },
          color: toolColor,
          lineWidth: toolSize,
          scale: scale
        }
        
        addAnnotation(newAnnotation)
      }
      setCurrentPath([])
    }
    // Note: Eraser already handles undo stack in handleMouseDown
  }

  // ✅ Double-click handler for editing text annotations
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    const clickedAnnotation = findAnnotationAtPosition(pos)
    
    if (clickedAnnotation && clickedAnnotation.type === 'text') {
      const canvas = overlayCanvasRef.current
      if (!canvas) return
      
      // Enter edit mode for text annotation
      setEditingAnnotationId(clickedAnnotation.id)
      setTextInput(clickedAnnotation.data.text)
      // Convert ratio back to canvas pixels for text position
      setTextPosition({ 
        x: clickedAnnotation.data.x * canvas.width, 
        y: clickedAnnotation.data.y * canvas.height 
      })
      // Convert fontSize ratio back to pixels
      const fontSizePixels = Math.round((clickedAnnotation.data.fontSize * canvas.height) / scale)
      setFontSize(fontSizePixels)
      setFontFamily(clickedAnnotation.data.fontFamily || 'Arial')
      setIsBold(clickedAnnotation.data.isBold || false)
      setIsItalic(clickedAnnotation.data.isItalic || false)
      setTextAlign(clickedAnnotation.data.textAlign || 'left')
      setToolColor(clickedAnnotation.color)
      setIsEditingText(true)
      setTimeout(() => textInputRef.current?.focus(), 0)
    }
  }

  const handleEraser = (pos: {x: number, y: number}) => {
    // This function is kept for potential future use or manual eraser calls
    // The actual erasing is now handled inline in handleMouseDown and handleMouseMove
    // for immediate visual feedback without state delays
  }

  // ✅ Add new annotation and update undo stack
  // This function pushes current state to undo stack and clears redo stack
  const addAnnotation = (annotation: Annotation) => {
    // Save current state to undo stack before adding new annotation
    saveToUndoStack()
    
    // Add new annotation to current state
    const newAnnotations = [...annotations, annotation]
    setAnnotations(newAnnotations)
    
    // Smooth redraw with requestAnimationFrame
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  const handleAddText = () => {
    if (!textPosition) {
      setIsEditingText(false)
      setEditingAnnotationId(null)
      return
    }
    
    if (!textInput.trim()) {
      // If empty, just cancel
      handleCancelText()
      return
    }
    
    // ✅ Calculate accurate text bounds using canvas measureText
    const textMetrics = measureText(textInput, fontSize, fontFamily, isBold, isItalic)
    
    // Check if we're editing an existing annotation
    if (editingAnnotationId) {
      saveToUndoStack()
      
      const canvas = overlayCanvasRef.current
      if (!canvas) return
      
      // When editing, update fontSize as ratio
      const fontSizeRatio = (fontSize * scale) / canvas.height
      
      const updatedAnnotations = annotations.map(a => {
        if (a.id === editingAnnotationId) {
          return {
            ...a,
            data: {
              ...a.data,
              text: textInput,
              fontSize: fontSizeRatio,  // Update as ratio
              fontFamily: fontFamily,
              isBold: isBold,
              isItalic: isItalic,
              textAlign: textAlign
            },
            color: toolColor,
            bounds: {
              x: a.data.x,
              y: a.data.y - (fontSize * scale / (2 * canvas.height)),  // Half fontSize above center
              width: textMetrics.width / canvas.width,
              height: (fontSize * scale) / canvas.height
            }
          }
        }
        return a
      })
      
      setAnnotations(updatedAnnotations)
      setEditingAnnotationId(null)
    } else {
      // Creating new annotation
      const canvas = overlayCanvasRef.current
      if (!canvas) return
      
      // Store fontSize as a ratio of canvas height for resolution independence
      const fontSizeRatio = (fontSize * scale) / canvas.height
      
      // Convert to ratios for resolution independence
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        page: currentPage,
        data: {
          text: textInput,
          x: textPosition.x / canvas.width,
          y: textPosition.y / canvas.height,  // Store click position as ratio
          fontSize: fontSizeRatio,  // Store as ratio, not absolute pixels
          fontFamily: fontFamily,
          isBold: isBold,
          isItalic: isItalic,
          textAlign: textAlign
        },
        color: toolColor,
        lineWidth: 0,
        scale: scale,
        bounds: {
          x: textPosition.x / canvas.width,
          y: (textPosition.y - (fontSize * scale)) / canvas.height,  // Bounds above the baseline
          width: textMetrics.width / canvas.width,
          height: (fontSize * scale) / canvas.height
        }
      }
      
      addAnnotation(newAnnotation)
    }
    
    setTextInput('')
    setTextPosition(null)
    setIsEditingText(false)
    
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  const handleCancelText = () => {
    setTextInput('')
    setTextPosition(null)
    setIsEditingText(false)
    setEditingAnnotationId(null)
  }

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddText()
    } else if (e.key === 'Escape') {
      handleCancelText()
    }
  }

  // ✅ Delete selected annotation
  const handleDeleteSelected = () => {
    if (!selectedAnnotationId) return
    
    saveToUndoStack()
    const newAnnotations = annotations.filter(a => a.id !== selectedAnnotationId)
    setAnnotations(newAnnotations)
    setSelectedAnnotationId(null)
    
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  // ✅ Copy selected annotation
  const handleCopy = () => {
    if (!selectedAnnotationId) return
    const annotation = annotations.find(a => a.id === selectedAnnotationId)
    if (annotation) {
      setCopiedAnnotation(annotation)
    }
  }

  // ✅ Paste copied annotation
  const handlePaste = () => {
    if (!copiedAnnotation) return
    
    saveToUndoStack()
    
    // Create a new annotation with offset position
    const newAnnotation: Annotation = {
      ...copiedAnnotation,
      id: Date.now().toString(),
      page: currentPage,
      data: {
        ...copiedAnnotation.data,
        x: copiedAnnotation.data.x + 20 / scale,
        y: copiedAnnotation.data.y + 20 / scale
      }
    }
    
    // Update bounds if they exist
    if (newAnnotation.bounds) {
      newAnnotation.bounds = {
        ...newAnnotation.bounds,
        x: newAnnotation.bounds.x + 20 / scale,
        y: newAnnotation.bounds.y + 20 / scale
      }
    }
    
    const newAnnotations = [...annotations, newAnnotation]
    setAnnotations(newAnnotations)
    setSelectedAnnotationId(newAnnotation.id)
    
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  // ✅ Nudge selected annotation with arrow keys
  const handleNudge = (key: string) => {
    if (!selectedAnnotationId) return
    
    const annotation = annotations.find(a => a.id === selectedAnnotationId)
    if (!annotation) return
    
    saveToUndoStack()
    
    const nudgeAmount = 2 / scale // 2 pixels in canvas coordinates
    let deltaX = 0
    let deltaY = 0
    
    switch (key) {
      case 'ArrowUp':
        deltaY = -nudgeAmount
        break
      case 'ArrowDown':
        deltaY = nudgeAmount
        break
      case 'ArrowLeft':
        deltaX = -nudgeAmount
        break
      case 'ArrowRight':
        deltaX = nudgeAmount
        break
    }
    
    // Update annotation position
    const updatedAnnotations = annotations.map(a => {
      if (a.id !== selectedAnnotationId) return a
      
      const updated = { ...a }
      
      if (a.type === 'text') {
        updated.data = {
          ...a.data,
          x: a.data.x + deltaX,
          y: a.data.y + deltaY
        }
        if (updated.bounds) {
          updated.bounds = {
            ...updated.bounds,
            x: updated.bounds.x + deltaX,
            y: updated.bounds.y + deltaY
          }
        }
      } else if (a.type === 'pen' || a.type === 'highlighter') {
        updated.data = {
          ...a.data,
          path: a.data.path.map((p: {x: number, y: number}) => ({
            x: p.x + deltaX,
            y: p.y + deltaY
          }))
        }
      } else if (a.type === 'rectangle' || a.type === 'ellipse') {
        updated.data = {
          ...a.data,
          x: a.data.x + deltaX,
          y: a.data.y + deltaY
        }
      } else if (a.type === 'line') {
        updated.data = {
          ...a.data,
          x1: a.data.x1 + deltaX,
          y1: a.data.y1 + deltaY,
          x2: a.data.x2 + deltaX,
          y2: a.data.y2 + deltaY
        }
      }
      
      return updated
    })
    
    setAnnotations(updatedAnnotations)
    
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  // ✅ Improved undo/redo with per-page history - zero lag
  // When undo is pressed, restore previous state from undo stack
  const handleUndo = () => {
    if (undoStack.length === 0) return
    
    // Save current state to redo stack
    saveToRedoStack([...annotations])
    
    // Get and remove last state from undo stack
    const previousState = popFromUndoStack()
    if (previousState) {
      setAnnotations(previousState)
      
      // Smooth redraw
      requestAnimationFrame(() => {
        if (overlayCanvasRef.current) {
          drawAllAnnotations()
        }
      })
    }
  }

  // When redo is pressed, restore the last undone state
  const handleRedo = () => {
    if (redoStack.length === 0) return
    
    // Save current state to undo stack
    setHistory(prev => ({
      ...prev,
      [currentPage]: {
        undoStack: [...(prev[currentPage]?.undoStack || []), [...annotations]],
        redoStack: prev[currentPage]?.redoStack || []
      }
    }))
    
    // Get and remove last state from redo stack
    const nextState = popFromRedoStack()
    if (nextState) {
      setAnnotations(nextState)
      
      // Smooth redraw
      requestAnimationFrame(() => {
        if (overlayCanvasRef.current) {
          drawAllAnnotations()
        }
      })
    }
  }

  const handleRotate = () => {
    setRotation((rotation + 90) % 360)
  }

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, 3)
    setScale(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.1)
    setScale(newScale)
  }

  // ✅ Allow users to enter custom zoom percentage (e.g., 75%, 100%, 150%)
  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('%', '').trim()
    
    // Allow empty string while typing
    if (value === '') {
      return
    }
    
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      // Clamp between 10% and 300% and update immediately for responsive feel
      const clampedValue = Math.max(10, Math.min(300, numValue))
      const newScale = clampedValue / 100
      setScale(newScale)
    }
  }

  const handleZoomBlur = () => {
    // Ensure scale is within valid range on blur
    if (scale < 0.1) {
      setScale(0.1)
    } else if (scale > 3) {
      setScale(3)
    }
  }

  // ✅ Handle Enter key in zoom input for instant apply
  const handleZoomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      // Force immediate redraw
      requestAnimationFrame(() => {
        if (overlayCanvasRef.current) {
          drawAllAnnotations()
        }
      })
    }
  }

  // ✅ Handle page change with automatic scrolling and annotation loading
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages && newPage !== currentPage) {
      // Save current page annotations before switching
      setAnnotationsByPage(prev => ({
        ...prev,
        [currentPage]: [...annotations]
      }))
      
      // Update to new page (useEffect will handle loading)
      setCurrentPage(newPage)
      
      // Scroll to the selected page
      setTimeout(() => {
        const pageElement = pageRefsMap.current.get(newPage)
        if (pageElement && containerRef.current) {
          pageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          })
        }
      }, 100)
    }
  }

  const handleClearPage = () => {
    // Save to undo before clearing
    saveToUndoStack()
    
    // Clear annotations for current page only
    setAnnotations([])
    
    // Also update the per-page storage
    setAnnotationsByPage(prev => ({
      ...prev,
      [currentPage]: []
    }))
    
    // Smooth redraw
    requestAnimationFrame(() => {
      if (overlayCanvasRef.current) {
        drawAllAnnotations()
      }
    })
  }

  // ✅ Export PDF with embedded annotations using pdf-lib - FIXED COORDINATE MAPPING
  const handleExportPDF = async () => {
    if (!file) return
    
    // Show loading toast
    const loadingToast = toast({
      title: "⏳ Exporting PDF...",
      description: "Please wait while we prepare your annotated PDF.",
      duration: Infinity,
    })
    
    try {
      // CRITICAL: Merge current page's annotations into annotationsByPage
      // The current page's annotations are in the 'annotations' array
      // and only get moved to annotationsByPage when switching pages
      const allAnnotationsByPage = {
        ...annotationsByPage,
        [currentPage]: annotations
      }
      
      // Read the original PDF file
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      const pages = pdfDoc.getPages()
      
      // Helper to parse hex color to RGB
      const parseColor = (hexColor: string) => {
        const colorMatch = hexColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
        return {
          r: colorMatch ? parseInt(colorMatch[1], 16) / 255 : 0,
          g: colorMatch ? parseInt(colorMatch[2], 16) / 255 : 0,
          b: colorMatch ? parseInt(colorMatch[3], 16) / 255 : 0
        }
      }
      
      // Helper to render annotation to canvas as image
      const renderAnnotationToImage = async (
        annotation: Annotation, 
        pdfPageWidth: number, 
        pdfPageHeight: number
      ): Promise<Uint8Array | null> => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        // Set canvas size to match PDF page dimensions
        canvas.width = pdfPageWidth
        canvas.height = pdfPageHeight
        
        // Pen/highlighter paths are stored as ratios (0.0 to 1.0)
        // Convert to PDF coordinates by multiplying by PDF dimensions
        
        ctx.strokeStyle = annotation.color
        ctx.lineWidth = annotation.lineWidth // Line width is already normalized
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        if (annotation.type === 'pen') {
          ctx.globalAlpha = 1.0
          ctx.beginPath()
          const path = annotation.data.path
          if (path.length > 0) {
            // Convert ratios to PDF pixel coordinates
            ctx.moveTo(path[0].x * pdfPageWidth, path[0].y * pdfPageHeight)
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x * pdfPageWidth, path[i].y * pdfPageHeight)
            }
            ctx.stroke()
          }
        } else if (annotation.type === 'highlighter') {
          ctx.globalAlpha = 0.3
          ctx.lineWidth = annotation.lineWidth * 3
          ctx.beginPath()
          const path = annotation.data.path
          if (path.length > 0) {
            // Convert ratios to PDF pixel coordinates
            ctx.moveTo(path[0].x * pdfPageWidth, path[0].y * pdfPageHeight)
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x * pdfPageWidth, path[i].y * pdfPageHeight)
            }
            ctx.stroke()
          }
        }
        
        // Convert canvas to PNG bytes
        return new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const arrayBuffer = await blob.arrayBuffer()
              resolve(new Uint8Array(arrayBuffer))
            } else {
              resolve(null)
            }
          }, 'image/png')
        })
      }
      
      // Process each page that has annotations
      for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
        const page = pages[pageNum - 1]
        const { width, height } = page.getSize()
        
        // Watermarks are now added as annotations, not automatically on export
        // They will be processed in the annotation loop below
        
        const pageAnnotations = allAnnotationsByPage[pageNum] || []
        if (pageAnnotations.length === 0) continue

        
        // Draw each annotation on the PDF page
        for (const annotation of pageAnnotations) {
          // All annotations now store coordinates as ratios (0.0 to 1.0)
          // Convert to PDF coordinates by multiplying by PDF dimensions
          
          if (annotation.type === 'text') {
            const x = annotation.data.x * width
            const y = height - (annotation.data.y * height) // PDF coords are bottom-up
            // fontSize is stored as ratio of canvas height - convert to PDF units
            const fontSize = annotation.data.fontSize * height
            
            const color = parseColor(annotation.color)
            
            // Map font family and style to StandardFonts
            const fontFamily = annotation.data.fontFamily || 'Helvetica'
            const isBold = annotation.data.isBold || false
            const isItalic = annotation.data.isItalic || false
            
            let fontKey = StandardFonts.Helvetica // default
            
            // Map common font families to PDF standard fonts
            if (fontFamily.toLowerCase().includes('times')) {
              if (isBold && isItalic) fontKey = StandardFonts.TimesRomanBoldItalic
              else if (isBold) fontKey = StandardFonts.TimesRomanBold
              else if (isItalic) fontKey = StandardFonts.TimesRomanItalic
              else fontKey = StandardFonts.TimesRoman
            } else if (fontFamily.toLowerCase().includes('courier')) {
              if (isBold && isItalic) fontKey = StandardFonts.CourierBoldOblique
              else if (isBold) fontKey = StandardFonts.CourierBold
              else if (isItalic) fontKey = StandardFonts.CourierOblique
              else fontKey = StandardFonts.Courier
            } else {
              // Default to Helvetica
              if (isBold && isItalic) fontKey = StandardFonts.HelveticaBoldOblique
              else if (isBold) fontKey = StandardFonts.HelveticaBold
              else if (isItalic) fontKey = StandardFonts.HelveticaOblique
              else fontKey = StandardFonts.Helvetica
            }
            
            const font = await pdfDoc.embedFont(fontKey)
            
            // Text is rendered with middle baseline on canvas
            // PDF drawText uses bottom baseline, so adjust by half the font size
            page.drawText(annotation.data.text, {
              x,
              y: y - fontSize / 2, // Adjust for middle baseline
              size: fontSize,
              font: font,
              color: rgb(color.r, color.g, color.b)
            })
          } else if (annotation.type === 'rectangle') {
            const x = annotation.data.x * width
            const y = height - (annotation.data.y * height) - (annotation.data.height * height)
            const w = annotation.data.width * width
            const h = annotation.data.height * height
            
            const color = parseColor(annotation.color)
            
            page.drawRectangle({
              x,
              y,
              width: w,
              height: h,
              borderColor: rgb(color.r, color.g, color.b),
              borderWidth: annotation.lineWidth
            })
          } else if (annotation.type === 'ellipse') {
            const cx = annotation.data.x * width
            const cy = height - (annotation.data.y * height)
            const rx = annotation.data.radiusX * width
            const ry = annotation.data.radiusY * height
            
            const color = parseColor(annotation.color)
            
            page.drawEllipse({
              x: cx,
              y: cy,
              xScale: rx,
              yScale: ry,
              borderColor: rgb(color.r, color.g, color.b),
              borderWidth: annotation.lineWidth
            })
          } else if (annotation.type === 'line') {
            const x1 = annotation.data.x1 * width
            const y1 = height - (annotation.data.y1 * height)
            const x2 = annotation.data.x2 * width
            const y2 = height - (annotation.data.y2 * height)
            
            const color = parseColor(annotation.color)
            
            page.drawLine({
              start: { x: x1, y: y1 },
              end: { x: x2, y: y2 },
              color: rgb(color.r, color.g, color.b),
              thickness: annotation.lineWidth
            })
          } else if (annotation.type === 'pen' || annotation.type === 'highlighter') {
            // Pen/highlighter: coordinates are stored as ratios
            // Render to canvas then embed as image
            const imageBytes = await renderAnnotationToImage(
              annotation, 
              width, 
              height
            )
            if (imageBytes) {
              try {
                const image = await pdfDoc.embedPng(imageBytes)
                page.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: width,
                  height: height,
                  opacity: 1.0
                })
              } catch (err) {
                console.warn('Failed to embed pen/highlighter stroke:', err)
              }
            }
          } else if (annotation.type === 'watermark') {
            console.log('Exporting watermark to PDF:', annotation)
            const x = annotation.data.x * width
            const y = height - (annotation.data.y * height)
            const fontSize = annotation.data.fontSize * height
            const rotation = annotation.data.rotation || 0
            const opacity = annotation.data.opacity || 0.3
            
            console.log('Watermark export params:', { x, y, fontSize, rotation, opacity, text: annotation.data.text })
            
            const color = parseColor(annotation.color)
            
            // For rotated watermark, we need to render to canvas and embed as image
            // because pdf-lib's drawText doesn't support rotation well
            const watermarkCanvas = document.createElement('canvas')
            watermarkCanvas.width = width
            watermarkCanvas.height = height
            const ctx = watermarkCanvas.getContext('2d')
            
            if (ctx) {
              ctx.clearRect(0, 0, width, height)
              ctx.save()
              
              // Transform to PDF coordinates (flip Y axis)
              const canvasY = annotation.data.y * height
              
              ctx.translate(x, canvasY)
              ctx.rotate((rotation * Math.PI) / 180)
              ctx.globalAlpha = opacity
              
              const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
              const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
              const fontFamily = annotation.data.fontFamily || 'Arial'
              ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
              ctx.fillStyle = annotation.color
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(annotation.data.text, 0, 0)
              
              ctx.restore()
              
              // Convert canvas to PNG and embed in PDF
              try {
                const watermarkBlob = await new Promise<Blob>((resolve) => {
                  watermarkCanvas.toBlob((blob) => resolve(blob!), 'image/png')
                })
                const watermarkBytes = await watermarkBlob.arrayBuffer()
                const watermarkImage = await pdfDoc.embedPng(new Uint8Array(watermarkBytes))
                
                console.log('Watermark image embedded successfully')
                page.drawImage(watermarkImage, {
                  x: 0,
                  y: 0,
                  width: width,
                  height: height,
                  opacity: 1.0 // Opacity already applied in canvas
                })
              } catch (err) {
                console.error('Failed to embed watermark:', err)
              }
            }
          }
        }
      }
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `annotated-${file.name}`
      link.click()
      
      URL.revokeObjectURL(link.href)
      
      // Dismiss loading toast
      loadingToast.dismiss()
      
      // Show success toast
      toast({
        title: "✅ PDF Exported Successfully!",
        description: `Your annotated PDF "${file.name.replace('.pdf', '_annotated.pdf')}" has been downloaded.`,
        duration: 5000,
      })
    } catch (error) {
      console.error('❌ Export error:', error)
      
      // Dismiss loading toast
      loadingToast.dismiss()
      
      toast({
        title: "❌ Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export PDF. Please try again.',
        variant: "destructive",
        duration: 7000,
      })
    }
  }

  const handleDownload = async () => {
    if (!file) return
    
    // Show beautiful selection dialog with three options
    setShowCustomPagesDialog(true)
  }
  
  const handleDownloadCurrentPage = async () => {
    if (!pageCanvasRef.current || !overlayCanvasRef.current) return
    
    const pdfCanvas = pageCanvasRef.current.querySelector('canvas')
    if (!pdfCanvas) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = pdfCanvas.width
    canvas.height = pdfCanvas.height
    
    // Draw PDF
    ctx.drawImage(pdfCanvas, 0, 0)
    // Draw annotations
    ctx.drawImage(overlayCanvasRef.current, 0, 0)
    
    // Download
    const link = document.createElement('a')
    link.download = `edited-page-${currentPage}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    
    toast({
      title: "✅ Page Exported!",
      description: `Page ${currentPage} has been downloaded as PNG.`,
      duration: 4000,
    })
  }
  
  const handleDownloadAllPages = async () => {
    if (!file) return
    
    // Show loading toast
    const loadingToast = toast({
      title: "⏳ Exporting All Pages...",
      description: `Rendering ${numPages} pages with annotations. This may take a moment...`,
      duration: Infinity,
    })
    
    try {
      // CRITICAL: Merge current page's annotations
      const allAnnotationsByPage = {
        ...annotationsByPage,
        [currentPage]: annotations
      }
      
      await exportPagesToZip(allAnnotationsByPage, Array.from({ length: numPages }, (_, i) => i + 1), loadingToast)
    } catch (error) {
      console.error('Failed to export all pages:', error)
      
      // Dismiss loading toast
      loadingToast.dismiss()
      
      toast({
        title: "❌ Export Failed",
        description: "Failed to export all pages. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }
  
  const handleDownloadCustomPages = async (pageRanges: string) => {
    if (!file) return
    
    // Parse page ranges (e.g., "1,3,5-8,10")
    const pages = parsePageRanges(pageRanges, numPages)
    
    if (pages.length === 0) {
      toast({
        title: "❌ Invalid Page Range",
        description: "Please enter valid page numbers or ranges (e.g., 1,3,5-8).",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    
    // Show loading toast
    const loadingToast = toast({
      title: "⏳ Exporting Custom Pages...",
      description: `Rendering ${pages.length} selected page(s) with annotations...`,
      duration: Infinity,
    })
    
    try {
      // CRITICAL: Merge current page's annotations
      const allAnnotationsByPage = {
        ...annotationsByPage,
        [currentPage]: annotations
      }
      
      await exportPagesToZip(allAnnotationsByPage, pages, loadingToast)
    } catch (error) {
      console.error('Failed to export custom pages:', error)
      
      // Dismiss loading toast
      loadingToast.dismiss()
      
      toast({
        title: "❌ Export Failed",
        description: "Failed to export custom pages. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }
  
  // Helper function to parse page ranges
  const parsePageRanges = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>()
    const parts = input.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "5-8"
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (!isNaN(start) && !isNaN(end) && start > 0 && end <= maxPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.add(i)
          }
        }
      } else {
        // Single page like "3"
        const page = parseInt(part)
        if (!isNaN(page) && page > 0 && page <= maxPages) {
          pages.add(page)
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b)
  }
  
  // Unified export function for multiple pages
  const exportPagesToZip = async (
    allAnnotationsByPage: Record<number, Annotation[]>, 
    pagesToExport: number[],
    loadingToast: any
  ) => {
    if (!file) return
    
    // Use pdfjs to render all pages
    const loadingTask = pdfjs.getDocument(URL.createObjectURL(file))
    const pdf = await loadingTask.promise
    
    const zip = new (await import('jszip')).default()
    
    for (const pageNum of pagesToExport) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // Higher quality
      
      // Create canvas for this page
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // Render PDF page
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise
      
      // Draw annotations for this page
      const pageAnnotations = allAnnotationsByPage[pageNum] || []
      if (pageAnnotations.length > 0) {
        const annotationCanvas = document.createElement('canvas')
        const annotationCtx = annotationCanvas.getContext('2d')
        if (annotationCtx) {
          annotationCanvas.width = viewport.width
          annotationCanvas.height = viewport.height
          
          // Draw each annotation
          pageAnnotations.forEach(annotation => {
            // CRITICAL: Different coordinate systems for different annotation types
            // - Text/shapes: coordinates are divided by annotation.scale (normalized)
            //   Need to multiply by viewport scale (2.0) to get canvas pixels
            // - Pen/highlighter: coordinates are raw canvas pixels at annotation.scale
            //   Need to scale by (viewport scale / annotation.scale) = 2.0 / annotation.scale
            
            annotationCtx.strokeStyle = annotation.color
            annotationCtx.lineCap = 'round'
            annotationCtx.lineJoin = 'round'
            
            if (annotation.type === 'pen') {
              const scaleFactor = 2.0 / annotation.scale // Raw pixels to viewport
              annotationCtx.globalAlpha = 1.0
              annotationCtx.lineWidth = annotation.lineWidth * scaleFactor
              annotationCtx.beginPath()
              const path = annotation.data.path
              if (path.length > 0) {
                annotationCtx.moveTo(path[0].x * scaleFactor, path[0].y * scaleFactor)
                for (let i = 1; i < path.length; i++) {
                  annotationCtx.lineTo(path[i].x * scaleFactor, path[i].y * scaleFactor)
                }
                annotationCtx.stroke()
              }
            } else if (annotation.type === 'highlighter') {
              const scaleFactor = 2.0 / annotation.scale // Raw pixels to viewport
              annotationCtx.globalAlpha = 0.3
              annotationCtx.lineWidth = annotation.lineWidth * 3 * scaleFactor
              annotationCtx.beginPath()
              const path = annotation.data.path
              if (path.length > 0) {
                annotationCtx.moveTo(path[0].x * scaleFactor, path[0].y * scaleFactor)
                for (let i = 1; i < path.length; i++) {
                  annotationCtx.lineTo(path[i].x * scaleFactor, path[i].y * scaleFactor)
                }
                annotationCtx.stroke()
              }
              annotationCtx.globalAlpha = 1.0
            } else if (annotation.type === 'text') {
              const scaleFactor = 2.0 // Normalized coords to viewport
              const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
              const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
              const fontFamily = annotation.data.fontFamily || 'Arial'
              annotationCtx.font = `${fontStyle} ${fontWeight} ${annotation.data.fontSize * scaleFactor}px ${fontFamily}`
              annotationCtx.fillStyle = annotation.color
              annotationCtx.textAlign = annotation.data.textAlign || 'left'
              annotationCtx.fillText(
                annotation.data.text,
                annotation.data.x * scaleFactor,
                annotation.data.y * scaleFactor
              )
              annotationCtx.textAlign = 'left'
            } else if (annotation.type === 'rectangle') {
              const scaleFactor = 2.0 // Normalized coords to viewport
              annotationCtx.lineWidth = annotation.lineWidth * scaleFactor
              annotationCtx.strokeRect(
                annotation.data.x * scaleFactor,
                annotation.data.y * scaleFactor,
                annotation.data.width * scaleFactor,
                annotation.data.height * scaleFactor
              )
            } else if (annotation.type === 'ellipse') {
              const scaleFactor = 2.0 // Normalized coords to viewport
              annotationCtx.lineWidth = annotation.lineWidth * scaleFactor
              annotationCtx.beginPath()
              annotationCtx.ellipse(
                annotation.data.x * scaleFactor,
                annotation.data.y * scaleFactor,
                annotation.data.radiusX * scaleFactor,
                annotation.data.radiusY * scaleFactor,
                0, 0, 2 * Math.PI
              )
              annotationCtx.stroke()
            } else if (annotation.type === 'line') {
              const scaleFactor = 2.0 // Normalized coords to viewport
              annotationCtx.lineWidth = annotation.lineWidth * scaleFactor
              annotationCtx.beginPath()
              annotationCtx.moveTo(annotation.data.x1 * scaleFactor, annotation.data.y1 * scaleFactor)
              annotationCtx.lineTo(annotation.data.x2 * scaleFactor, annotation.data.y2 * scaleFactor)
              annotationCtx.stroke()
            } else if (annotation.type === 'watermark') {
              const scaleFactor = 2.0 // Normalized coords to viewport
              annotationCtx.save()
              const x = annotation.data.x * scaleFactor
              const y = annotation.data.y * scaleFactor
              const fontSize = annotation.data.fontSize * scaleFactor
              
              annotationCtx.translate(x, y)
              annotationCtx.rotate((annotation.data.rotation * Math.PI) / 180)
              annotationCtx.globalAlpha = annotation.data.opacity || 0.3
              
              const fontWeight = annotation.data.isBold ? 'bold' : 'normal'
              const fontStyle = annotation.data.isItalic ? 'italic' : 'normal'
              const fontFamily = annotation.data.fontFamily || 'Arial'
              annotationCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
              annotationCtx.fillStyle = annotation.color
              annotationCtx.textAlign = annotation.data.textAlign || 'center'
              annotationCtx.textBaseline = 'middle'
              annotationCtx.fillText(annotation.data.text, 0, 0)
              
              annotationCtx.restore()
            }
          })
          
          // Composite annotations onto PDF
          ctx.drawImage(annotationCanvas, 0, 0)
        }
      }
      
      // Convert to blob and add to zip
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
      })
      
      zip.file(`page-${pageNum}.png`, blob)
    }
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = `${file.name.replace('.pdf', '')}-pages.zip`
    link.click()
    
    URL.revokeObjectURL(link.href)
    
    // Dismiss loading toast
    loadingToast.dismiss()
    
    toast({
      title: "✅ Pages Exported!",
      description: `${pagesToExport.length} page(s) have been downloaded as a ZIP file.`,
      duration: 5000,
    })
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        {/* Selection & Drawing Tools */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden xl:inline">Draw</span>
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'select' ? null : 'select')
              setSelectedAnnotationId(null)
            }}
            title="Select/Move Annotation (S)"
            aria-label="Select and move annotations"
            className={activeTool === 'select' ? 'shadow-lg' : ''}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'pen' ? null : 'pen')
              setSelectedAnnotationId(null)
            }}
            title="Pen (P)"
            aria-label="Draw with pen"
            className={activeTool === 'pen' ? 'shadow-lg' : ''}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'highlighter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'highlighter' ? null : 'highlighter')
              setSelectedAnnotationId(null)
            }}
            title="Highlighter (H)"
            aria-label="Highlight with marker"
            className={activeTool === 'highlighter' ? 'shadow-lg' : ''}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'eraser' ? null : 'eraser')
              setSelectedAnnotationId(null)
            }}
            title="Eraser (E)"
            aria-label="Erase annotations"
            className={activeTool === 'eraser' ? 'shadow-lg' : ''}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Text Tool */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden xl:inline">Text</span>
          <Button
            variant={activeTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'text' ? null : 'text')
              setSelectedAnnotationId(null)
            }}
            title="Add Text (T)"
            aria-label="Add text annotation"
            className={activeTool === 'text' ? 'shadow-lg' : ''}
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        {/* Shape Tools */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden xl:inline">Shapes</span>
          <Button
            variant={activeTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'rectangle' ? null : 'rectangle')
              setSelectedAnnotationId(null)
            }}
            title="Rectangle (R)"
            aria-label="Draw rectangle"
            className={activeTool === 'rectangle' ? 'shadow-lg' : ''}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'ellipse' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'ellipse' ? null : 'ellipse')
              setSelectedAnnotationId(null)
            }}
            title="Ellipse (C)"
            aria-label="Draw ellipse"
            className={activeTool === 'ellipse' ? 'shadow-lg' : ''}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'line' ? null : 'line')
              setSelectedAnnotationId(null)
            }}
            title="Line (L)"
            aria-label="Draw line"
            className={activeTool === 'line' ? 'shadow-lg' : ''}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Watermark Tool */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden xl:inline">Mark</span>
          <Button
            variant={activeTool === 'watermark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === 'watermark' ? null : 'watermark')
              setSelectedAnnotationId(null)
            }}
            title="Add Watermark (W)"
            aria-label="Add watermark"
            className={activeTool === 'watermark' ? 'shadow-lg' : ''}
          >
            <Droplets className="h-4 w-4" />
          </Button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden xl:inline">History</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            aria-label="Redo action"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 border-r-2 border-slate-300 dark:border-slate-600 pr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 hidden 2xl:inline">View</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom Out (-10%)"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={Math.round(scale * 100)}
            onChange={handleZoomInputChange}
            onKeyDown={handleZoomKeyDown}
            onBlur={handleZoomBlur}
            className="w-16 h-8 text-center text-sm px-1 font-semibold transition-all focus:ring-2 focus:ring-blue-500"
            placeholder="100"
            min="10"
            max="300"
            title="Enter zoom percentage (10-300%) - Press Enter to apply"
            aria-label="Zoom percentage"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In (+10%)"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            title="Rotate 90°"
            aria-label="Rotate page 90 degrees"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            title="Keyboard Shortcuts: S=Select, P=Pen, H=Highlighter, T=Text, R=Rectangle, C=Circle, L=Line, E=Eraser, W=Watermark, Ctrl+Z=Undo, Ctrl+Y=Redo, Delete=Remove, Ctrl+C/V=Copy/Paste"
            aria-label="Keyboard shortcuts help"
            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hidden lg:flex"
          >
            <span className="text-sm font-semibold">?</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearPage}
            title="Clear Page"
            aria-label="Clear all annotations on current page"
            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportPDF}
            title="Export as PDF with embedded annotations"
            aria-label="Export as PDF"
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-md hover:shadow-lg"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden md:inline">Export PDF</span>
            <span className="md:hidden">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title="Download pages as PNG images"
            aria-label="Export as PNG images"
            className="gap-1.5"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden md:inline">Export PNG</span>
            <span className="md:hidden">PNG</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area with Sidebars */}
      <div className="flex h-[calc(100vh-60px)] overflow-hidden">
        {/* Left Sidebar - Pages Thumbnails */}
        <div className="w-24 lg:w-28 bg-white dark:bg-slate-800 border-r-2 border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0 shadow-sm hidden sm:block">
          <div className="p-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 px-1 uppercase tracking-wide">Pages</h3>
            <div className="space-y-1.5">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`cursor-pointer rounded border-2 p-1 transition-all duration-200 hover:scale-105 ${
                    currentPage === pageNum
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handlePageChange(pageNum)
                    }
                  }}
                >
                  <div className="relative bg-white flex items-center justify-center overflow-hidden rounded">
                    {pdfUrl && (
                      <Document file={pdfUrl}>
                        <Page
                          pageNumber={pageNum}
                          width={90}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    )}
                  </div>
                  <p className={`text-xs text-center mt-1.5 font-semibold transition-colors ${
                    currentPage === pageNum 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    Page {pageNum}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle - Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-auto max-w-3xl"
        >
          <div className="inline-flex flex-col items-center gap-2 py-2 px-1 min-w-full justify-center min-h-full">
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 border-4 border-blue-300 border-b-transparent rounded-full animate-spin animate-reverse"></div>
                      </div>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 shadow-lg">
                      <p className="text-red-700 dark:text-red-400 font-bold text-lg mb-2">⚠️ Failed to load PDF</p>
                      <p className="text-sm text-red-600 dark:text-red-300">Please try uploading again</p>
                    </div>
                  </div>
                }
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div 
                    key={pageNum}
                    ref={(el) => {
                      if (el) pageRefsMap.current.set(pageNum, el)
                    }}
                    className={`relative bg-white shadow-2xl mb-6 transition-all duration-300 rounded-lg overflow-hidden ${
                      pageNum === currentPage 
                        ? 'ring-4 ring-blue-500 ring-opacity-50 scale-100' 
                        : 'hover:ring-2 hover:ring-blue-300 cursor-pointer opacity-90 hover:opacity-100'
                    }`}
                    style={{ minHeight: pageNum === currentPage ? 'auto' : '400px' }}
                    onClick={() => {
                      // ✅ Allow editing on any page by clicking it
                      if (pageNum !== currentPage) {
                        handlePageChange(pageNum)
                      }
                    }}
                  >
                    {/* Page number indicator */}
                    {pageNum !== currentPage && (
                      <div className="absolute top-3 left-3 bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-10 font-semibold transition-all hover:bg-blue-600 hover:scale-105">
                        Page {pageNum} - Click to edit
                      </div>
                    )}
                    {pageNum === currentPage && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-2 font-semibold">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></span>
                        Page {pageNum} - Editing
                      </div>
                    )}
                    <div ref={pageNum === currentPage ? pageCanvasRef : null}>
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        rotate={rotation}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={pageNum === currentPage ? onPageLoadSuccess : undefined}
                        loading={
                          <div className="flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        }
                      />
                    </div>
                    
                    {/* Static annotation overlay for non-current pages */}
                    {pageNum !== currentPage && (
                      <StaticAnnotationCanvas 
                        pageNumber={pageNum}
                        annotationsByPage={annotationsByPage}
                        scale={scale}
                        activeTool={activeTool}
                        watermarkText={watermarkText}
                        watermarkOpacity={watermarkOpacity}
                        watermarkRotation={watermarkRotation}
                        watermarkFontSize={watermarkFontSize}
                        watermarkColor={watermarkColor}
                        watermarkPosition={watermarkPosition}
                      />
                    )}
                    
                    {/* Interactive canvas for current page */}
                    {pageNum === currentPage && (
                      <>
                        <canvas
                          key={`canvas-${pageNum}`}
                          ref={overlayCanvasRef}
                          className={`absolute top-0 left-0 pointer-events-auto outline-none transition-shadow ${
                            canvasHasFocus ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' : ''
                          } ${
                            activeTool === 'select' ? 'cursor-default' :
                            activeTool === 'eraser' ? 'cursor-cell' : 
                            activeTool === 'text' ? 'cursor-text' : 
                            activeTool ? 'cursor-crosshair' : 'cursor-default'
                          }`}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onDoubleClick={handleDoubleClick}
                          onClick={() => setCanvasHasFocus(true)}
                          onBlur={() => setCanvasHasFocus(false)}
                          tabIndex={0}
                          role="application"
                          aria-label={`PDF page ${pageNum} editing canvas. Active tool: ${activeTool || 'none'}. Use keyboard shortcuts: S=Select, P=Pen, H=Highlighter, T=Text`}
                          aria-describedby="keyboard-shortcuts-help"
                          onMouseLeave={() => {
                            setIsDrawing(false)
                            setIsDragging(false)
                            setIsResizing(false)
                          }}
                        />
                        {/* Inline text input */}
                        {isEditingText && textPosition && overlayCanvasRef.current && (
                          <input
                            ref={textInputRef}
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={handleTextKeyDown}
                            onBlur={handleAddText}
                            className="absolute border-2 border-blue-500 bg-white px-2 py-1 outline-none z-10"
                            style={{
                              left: `${(textPosition.x / overlayCanvasRef.current.width) * overlayCanvasRef.current.offsetWidth}px`,
                              top: `${(textPosition.y / overlayCanvasRef.current.height) * overlayCanvasRef.current.offsetHeight - (fontSize * scale) / 2}px`,
                              fontSize: `${fontSize}px`,
                              color: toolColor,
                              minWidth: '150px',
                              height: `${fontSize * 1.2}px`,
                              lineHeight: `${fontSize * 1.2}px`,
                              fontFamily: fontFamily,
                              fontWeight: isBold ? 'bold' : 'normal',
                              fontStyle: isItalic ? 'italic' : 'normal',
                              textAlign: textAlign,
                              transform: `scale(${scale})`,
                              transformOrigin: 'top left',
                              verticalAlign: 'middle'
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </Document>
            )}
          </div>
        </div>

        {/* Right Sidebar - Tool Settings Panel */}
        <div className="w-72 lg:w-80 xl:w-96 flex-shrink-0 bg-white dark:bg-slate-800 border-l-2 border-slate-200 dark:border-slate-700 overflow-y-auto hidden md:block">
            <div className="p-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                {activeTool ? (
                  <>
                    {activeTool === 'pen' && <Pen className="h-4 w-4" />}
                    {activeTool === 'highlighter' && <Highlighter className="h-4 w-4" />}
                    {activeTool === 'eraser' && <Eraser className="h-4 w-4" />}
                    {activeTool === 'text' && <Type className="h-4 w-4" />}
                    {activeTool === 'rectangle' && <Square className="h-4 w-4" />}
                    {activeTool === 'ellipse' && <Circle className="h-4 w-4" />}
                    {activeTool === 'line' && <Minus className="h-4 w-4" />}
                    {activeTool === 'select' && <Move className="h-4 w-4" />}
                    {activeTool === 'watermark' && <Droplets className="h-4 w-4" />}
                    {activeTool === 'line' && <Minus className="h-4 w-4" />}
                    {activeTool === 'select' && <Move className="h-4 w-4" />}
                    {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Settings
                  </>
                ) : (
                  'Select a Tool'
                )}
              </h3>
            
            {/* PEN TOOL SETTINGS */}
            {activeTool === 'pen' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Stroke Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                    />
                    <Input
                      type="text"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Stroke Width: {toolSize}px
                  </Label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={toolSize}
                    onChange={(e) => setToolSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1px</span>
                    <span>20px</span>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Tip:</strong> Draw smooth freehand strokes with the pen tool.
                  </p>
                </div>
              </div>
            )}

            {/* HIGHLIGHTER TOOL SETTINGS */}
            {activeTool === 'highlighter' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Highlight Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                    />
                    <Input
                      type="text"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="flex-1"
                      placeholder="#FFFF00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Opacity: {Math.round(highlighterOpacity * 100)}%
                  </Label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={highlighterOpacity}
                    onChange={(e) => setHighlighterOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Stroke Width: {toolSize}px
                  </Label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={toolSize}
                    onChange={(e) => setToolSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5px</span>
                    <span>30px</span>
                  </div>
                </div>
              </div>
            )}

            {/* ERASER TOOL SETTINGS */}
            {activeTool === 'eraser' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Eraser Size: {toolSize * 8}px
                  </Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={toolSize}
                    onChange={(e) => setToolSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>8px</span>
                    <span>80px</span>
                  </div>
                </div>
                
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    <strong>⚠️ Warning:</strong> Eraser removes annotations within radius. This action can be undone.
                  </p>
                </div>
              </div>
            )}

            {/* TEXT TOOL SETTINGS */}
            {activeTool === 'text' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Font Family</Label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
                  >
                    <optgroup label="Sans Serif">
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Geneva">Geneva</option>
                    </optgroup>
                    <optgroup label="Serif">
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Garamond">Garamond</option>
                      <option value="Palatino">Palatino</option>
                      <option value="Book Antiqua">Book Antiqua</option>
                    </optgroup>
                    <optgroup label="Monospace">
                      <option value="Courier New">Courier New</option>
                      <option value="Monaco">Monaco</option>
                      <option value="Consolas">Consolas</option>
                      <option value="Courier">Courier</option>
                    </optgroup>
                    <optgroup label="Cursive & Fantasy">
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Brush Script MT">Brush Script MT</option>
                      <option value="Lucida Handwriting">Lucida Handwriting</option>
                      <option value="Impact">Impact</option>
                    </optgroup>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Font Size: {fontSize}px
                  </Label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>8px</span>
                    <span>72px</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                    />
                    <Input
                      type="text"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Font Style</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={isBold ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsBold(!isBold)}
                      className="flex-1"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isItalic ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsItalic(!isItalic)}
                      className="flex-1"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Text Alignment</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTextAlign('left')}
                      className="flex-1"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTextAlign('center')}
                      className="flex-1"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTextAlign('right')}
                      className="flex-1"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SHAPE TOOLS SETTINGS (Rectangle, Ellipse, Line) */}
            {(activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line') && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Border Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                    />
                    <Input
                      type="text"
                      value={toolColor}
                      onChange={(e) => setToolColor(e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                {(activeTool === 'rectangle' || activeTool === 'ellipse') && (
                  <div>
                    <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Fill Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                      />
                      <Input
                        type="text"
                        value={fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="flex-1"
                        placeholder="transparent"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFillColor('transparent')}
                        className="whitespace-nowrap"
                      >
                        None
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Border Thickness: {toolSize}px
                  </Label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={toolSize}
                    onChange={(e) => setToolSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1px</span>
                    <span>20px</span>
                  </div>
                </div>
              </div>
            )}

            {/* WATERMARK TOOL SETTINGS */}
            {activeTool === 'watermark' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Watermark Text</Label>
                  <Input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                    />
                    <Input
                      type="text"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Font Size: {watermarkFontSize}px
                  </Label>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={watermarkFontSize}
                    onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>12px</span>
                    <span>120px</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </Label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">
                    Rotation: {watermarkRotation}°
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={watermarkRotation}
                    onChange={(e) => setWatermarkRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0°</span>
                    <span>360°</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block text-slate-700 dark:text-slate-300">Position</Label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <Button
                  onClick={() => {
                    if (!watermarkText || watermarkText.trim() === '') {
                      toast({
                        title: "⚠️ Watermark Text Required",
                        description: "Please enter watermark text before applying.",
                        variant: "destructive",
                        duration: 3000,
                      })
                      return
                    }
                    
                    const canvas = overlayCanvasRef.current
                    if (!canvas) return
                    
                    // Calculate position based on selection
                    let xRatio = 0.5
                    let yRatio = 0.5
                    
                    switch (watermarkPosition) {
                      case 'top-left':
                        xRatio = 0.2
                        yRatio = 0.2
                        break
                      case 'top-right':
                        xRatio = 0.8
                        yRatio = 0.2
                        break
                      case 'bottom-left':
                        xRatio = 0.2
                        yRatio = 0.8
                        break
                      case 'bottom-right':
                        xRatio = 0.8
                        yRatio = 0.8
                        break
                      case 'center':
                      default:
                        xRatio = 0.5
                        yRatio = 0.5
                        break
                    }
                    
                    // Save current page annotations first
                    const updatedAnnotationsByPage = {
                      ...annotationsByPage,
                      [currentPage]: annotations
                    }
                    
                    // Convert fontSize from pixels to ratio
                    const fontSizeRatio = watermarkFontSize / canvas.height
                    
                    // ALWAYS add watermark annotation to ALL pages
                    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                      const watermarkAnnotation: Annotation = {
                        id: `watermark-${pageNum}-${Date.now()}`,
                        type: 'watermark',
                        page: pageNum,
                        data: {
                          text: watermarkText,
                          x: xRatio,
                          y: yRatio,
                          fontSize: fontSizeRatio, // Use ratio, not pixels
                          rotation: watermarkRotation,
                          opacity: watermarkOpacity,
                          fontFamily: 'Helvetica',
                          isBold: true,
                          isItalic: false
                        },
                        color: watermarkColor,
                        lineWidth: 0,
                        scale: scale,
                        bounds: {
                          x: xRatio,
                          y: yRatio,
                          width: 0.3,
                          height: 0.1
                        }
                      }
                      
                      // Add watermark to each page's annotations
                      const pageAnnotations = updatedAnnotationsByPage[pageNum] || []
                      updatedAnnotationsByPage[pageNum] = [...pageAnnotations, watermarkAnnotation]
                    }
                    
                    // Update state with all pages including watermarks
                    setAnnotationsByPage(updatedAnnotationsByPage)
                    
                    // Update current page's annotations to show the watermark immediately
                    const currentPageAnnotations = updatedAnnotationsByPage[currentPage] || []
                    setAnnotations([...currentPageAnnotations])
                    
                    // Force redraw
                    requestAnimationFrame(() => drawAllAnnotations())
                    
                    toast({
                      title: "✅ Watermark Applied to All Pages!",
                      description: `Watermark has been added to all ${numPages} pages. You can continue editing or export when ready.`,
                      duration: 4000,
                    })
                    
                    requestAnimationFrame(() => drawAllAnnotations())
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Watermark
                </Button>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Tip:</strong> Watermark will be applied to all pages in the document. Click "Apply Watermark" to save it permanently. You can then continue editing with other tools.
                  </p>
                </div>
              </div>
            )}

            {/* SELECT TOOL SETTINGS */}
            {activeTool === 'select' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
                    🎯 Selection Mode
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Click any annotation to select</li>
                    <li>• Drag to move position</li>
                    <li>• Use corner handles to resize</li>
                    <li>• Press Delete key to remove</li>
                  </ul>
                </div>
                
                {selectedAnnotationId && (
                  <>
                    {(() => {
                      const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId)
                      
                      return (
                        <>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                              ✓ {selectedAnnotation?.type.charAt(0).toUpperCase()}{selectedAnnotation?.type.slice(1)} Selected
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ID: {selectedAnnotationId.slice(0, 12)}...
                            </p>
                          </div>
                          
                          {/* Text Annotation Editing Controls */}
                          {selectedAnnotation?.type === 'text' && (
                            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide flex items-center gap-2">
                                <Type className="h-3 w-3" />
                                Edit Text Properties
                              </h4>
                              
                              {/* Font Size */}
                              <div>
                                <Label htmlFor="selected-font-size" className="text-xs">
                                  Font Size: {Math.round(selectedAnnotation.data.fontSize * (overlayCanvasRef.current?.height || 1))}px
                                </Label>
                                <input
                                  id="selected-font-size"
                                  type="range"
                                  min="8"
                                  max="72"
                                  value={Math.round(selectedAnnotation.data.fontSize * (overlayCanvasRef.current?.height || 1))}
                                  onChange={(e) => {
                                    const newSizePixels = parseInt(e.target.value)
                                    const canvas = overlayCanvasRef.current
                                    if (!canvas) return
                                    
                                    // Convert pixel size to ratio
                                    const newSizeRatio = newSizePixels / canvas.height
                                    
                                    setAnnotations(annotations.map(a => {
                                      if (a.id === selectedAnnotationId && a.type === 'text') {
                                        const textMetrics = measureText(a.data.text, newSizePixels, a.data.fontFamily, a.data.isBold, a.data.isItalic)
                                        return {
                                          ...a,
                                          data: { ...a.data, fontSize: newSizeRatio },
                                          bounds: {
                                            x: a.data.x,
                                            y: a.data.y - (newSizeRatio / 2),
                                            width: textMetrics.width / canvas.width,
                                            height: newSizeRatio
                                          }
                                        }
                                      }
                                      return a
                                    }))
                                    requestAnimationFrame(() => drawAllAnnotations())
                                  }}
                                  className="w-full h-2 bg-blue-200 dark:bg-blue-700 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                              
                              {/* Font Family */}
                              <div>
                                <Label htmlFor="selected-font-family" className="text-xs">Font Family</Label>
                                <select
                                  id="selected-font-family"
                                  value={selectedAnnotation.data.fontFamily || 'Arial'}
                                  onChange={(e) => {
                                    setAnnotations(annotations.map(a => {
                                      if (a.id === selectedAnnotationId && a.type === 'text') {
                                        return {
                                          ...a,
                                          data: { ...a.data, fontFamily: e.target.value }
                                        }
                                      }
                                      return a
                                    }))
                                    requestAnimationFrame(() => drawAllAnnotations())
                                  }}
                                  className="w-full px-2 py-1.5 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-slate-800"
                                >
                                  <option value="Arial">Arial</option>
                                  <option value="Times New Roman">Times New Roman</option>
                                  <option value="Courier New">Courier New</option>
                                  <option value="Georgia">Georgia</option>
                                  <option value="Verdana">Verdana</option>
                                  <option value="Comic Sans MS">Comic Sans MS</option>
                                </select>
                              </div>
                              
                              {/* Text Color */}
                              <div>
                                <Label htmlFor="selected-text-color" className="text-xs">Text Color</Label>
                                <input
                                  id="selected-text-color"
                                  type="color"
                                  value={selectedAnnotation.color}
                                  onChange={(e) => {
                                    setAnnotations(annotations.map(a => {
                                      if (a.id === selectedAnnotationId) {
                                        return { ...a, color: e.target.value }
                                      }
                                      return a
                                    }))
                                    requestAnimationFrame(() => drawAllAnnotations())
                                  }}
                                  className="w-full h-10 rounded border border-blue-300 dark:border-blue-600 cursor-pointer"
                                />
                              </div>
                              
                              {/* Text Style Toggles */}
                              <div className="flex gap-2">
                                <Button
                                  variant={selectedAnnotation.data.isBold ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setAnnotations(annotations.map(a => {
                                      if (a.id === selectedAnnotationId && a.type === 'text') {
                                        return {
                                          ...a,
                                          data: { ...a.data, isBold: !a.data.isBold }
                                        }
                                      }
                                      return a
                                    }))
                                    requestAnimationFrame(() => drawAllAnnotations())
                                  }}
                                  className="flex-1"
                                  title="Bold"
                                >
                                  <Bold className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant={selectedAnnotation.data.isItalic ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setAnnotations(annotations.map(a => {
                                      if (a.id === selectedAnnotationId && a.type === 'text') {
                                        return {
                                          ...a,
                                          data: { ...a.data, isItalic: !a.data.isItalic }
                                        }
                                      }
                                      return a
                                    }))
                                    requestAnimationFrame(() => drawAllAnnotations())
                                  }}
                                  className="flex-1"
                                  title="Italic"
                                >
                                  <Italic className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Text Alignment */}
                              <div>
                                <Label className="text-xs mb-2 block">Text Alignment</Label>
                                <div className="flex gap-2">
                                  <Button
                                    variant={selectedAnnotation.data.textAlign === 'right' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setAnnotations(annotations.map(a => {
                                        if (a.id === selectedAnnotationId && a.type === 'text') {
                                          return {
                                            ...a,
                                            data: { ...a.data, textAlign: 'right' }
                                          }
                                        }
                                        return a
                                      }))
                                      requestAnimationFrame(() => drawAllAnnotations())
                                    }}
                                    className="flex-1"
                                    title="Align Left"
                                  >
                                    <AlignLeft className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant={selectedAnnotation.data.textAlign === 'center' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setAnnotations(annotations.map(a => {
                                        if (a.id === selectedAnnotationId && a.type === 'text') {
                                          return {
                                            ...a,
                                            data: { ...a.data, textAlign: 'center' }
                                          }
                                        }
                                        return a
                                      }))
                                      requestAnimationFrame(() => drawAllAnnotations())
                                    }}
                                    className="flex-1"
                                    title="Align Center"
                                  >
                                    <AlignCenter className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant={selectedAnnotation.data.textAlign === 'left' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setAnnotations(annotations.map(a => {
                                        if (a.id === selectedAnnotationId && a.type === 'text') {
                                          return {
                                            ...a,
                                            data: { ...a.data, textAlign: 'left' }
                                          }
                                        }
                                        return a
                                      }))
                                      requestAnimationFrame(() => drawAllAnnotations())
                                    }}
                                    className="flex-1"
                                    title="Align Right"
                                  >
                                    <AlignRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const filteredAnnotations = annotations.filter(a => a.id !== selectedAnnotationId)
                              saveToUndoStack()
                              setAnnotations(filteredAnnotations)
                              setSelectedAnnotationId(null)
                            }}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </Button>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>
            )}

            {/* NO TOOL SELECTED */}
            {!activeTool && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    No tool selected
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Select a tool from the toolbar above to see its settings here
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Keyboard Shortcuts
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+Z</kbd> Undo</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+Y</kbd> Redo</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Delete</kbd> Remove selected</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+C/V</kbd> Copy & Paste</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Arrow Keys</kbd> Nudge annotation</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl++/-</kbd> Zoom in/out</p>
                    <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Double-click</kbd> Edit text</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Quick Tips
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <p>• Click canvas to enable shortcuts</p>
                    <p>• Drag text annotations to move them</p>
                    <p>• Use resize handles on selected text</p>
                    <p>• Each page has separate annotations</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* PDF Tools Panel */}
        <div className="w-64 lg:w-72 xl:w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-l-2 border-slate-200 dark:border-slate-700 overflow-y-auto hidden md:block">
          <div className="p-4 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              PDF Tools
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a tool to process your file
            </p>
          </div>
          <div className="p-4">
            <PDFTools 
              files={allFiles.length > 0 ? allFiles : (file ? [file] : [])} 
              onFilesChange={() => {}}
              onToolSelect={(tool) => {
                if (tool === 'watermark') {
                  setActiveTool('watermark')
                } else {
                  setActiveTool(null)
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Beautiful Confirmation Dialog */}
      {showConfirmDialog && confirmDialogConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {confirmDialogConfig.title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {confirmDialogConfig.message}
              </p>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-b-xl flex gap-3">
              <Button
                onClick={() => {
                  confirmDialogConfig.onCancel?.()
                  if (!confirmDialogConfig.onCancel) setShowConfirmDialog(false)
                }}
                variant="outline"
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                {confirmDialogConfig.cancelText || 'Cancel'}
              </Button>
              <Button
                onClick={() => {
                  confirmDialogConfig.onConfirm()
                }}
                variant={confirmDialogConfig.variant || 'default'}
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                {confirmDialogConfig.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Pages Export Dialog */}
      {showCustomPagesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Export Pages as PNG
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose which pages to export ({numPages} total pages)
              </p>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              {/* Quick Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setShowCustomPagesDialog(false)
                    handleDownloadCurrentPage()
                  }}
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2"
                >
                  <FileDown className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-semibold">Current Page</div>
                    <div className="text-xs text-slate-500">Page {currentPage}</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => {
                    setShowCustomPagesDialog(false)
                    handleDownloadAllPages()
                  }}
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2"
                >
                  <FileDown className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-semibold">All Pages</div>
                    <div className="text-xs text-slate-500">{numPages} pages</div>
                  </div>
                </Button>
              </div>
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                    OR
                  </span>
                </div>
              </div>
              
              {/* Custom Range */}
              <div className="space-y-2">
                <Label htmlFor="pageRange" className="text-sm font-medium">
                  Custom Page Range
                </Label>
                <Input
                  id="pageRange"
                  type="text"
                  placeholder="e.g., 1,3,5-8,10"
                  value={customPagesInput}
                  onChange={(e) => setCustomPagesInput(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter page numbers separated by commas. Use hyphens for ranges.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-b-xl flex gap-3">
              <Button
                onClick={() => {
                  setShowCustomPagesDialog(false)
                  setCustomPagesInput('')
                }}
                variant="outline"
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowCustomPagesDialog(false)
                  handleDownloadCustomPages(customPagesInput)
                  setCustomPagesInput('')
                }}
                disabled={!customPagesInput.trim()}
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Export Custom Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
