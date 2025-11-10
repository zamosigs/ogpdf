'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Zap, Shield, Clock, Scissors, Minimize2, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { SimplePDFPreview } from '@/components/simple-pdf-preview'
import { PDFTools } from '@/components/pdf-tools'
import { FileHistory } from '@/components/file-history'
import { ThemeToggle } from '@/components/theme-toggle'
import { LivePDFEditor } from '@/components/live-pdf-editor'
import Image from 'next/image'

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [watermarkSettings, setWatermarkSettings] = useState<{
    text: string
    fontSize: number
    color: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    angle: number
  } | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldBeDark)

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkMode = document.documentElement.classList.contains('dark')
          setIsDark(isDarkMode)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
    if (newFiles.length > 0) {
      const firstFile = newFiles[0]
      // Show preview for PDFs and images
      if (firstFile.type === 'application/pdf' || firstFile.type.startsWith('image/')) {
        setSelectedFile(firstFile)
      } else {
        setSelectedFile(null)
      }
    } else {
      setSelectedFile(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setFiles([])
                setSelectedFile(null)
                setWatermarkSettings(null)
              }}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer -my-10 -ml-4"
            >
              <Image 
                src={isDark ? "/logo/dark.png" : "/logo/light.png"}
                alt="OG PDF Logo" 
                width={160} 
                height={160}
                className="h-32 w-32 md:h-40 md:w-40 object-contain"
              />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Professional PDF Tools
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - File Upload - Only show when no files */}
      {files.length === 0 && (
        <section className="py-12 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
          {/* Animated Background decoration with multiple layers */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Floating PDF Icons Animation - More icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <FileText className="absolute top-20 left-10 h-8 w-8 text-primary/20 animate-float" style={{ animationDelay: '0s' }} />
            <FileText className="absolute top-40 right-20 h-6 w-6 text-primary/15 animate-float" style={{ animationDelay: '2s' }} />
            <FileText className="absolute bottom-32 left-1/4 h-10 w-10 text-primary/10 animate-float" style={{ animationDelay: '4s' }} />
            <FileText className="absolute bottom-20 right-1/3 h-7 w-7 text-primary/20 animate-float" style={{ animationDelay: '3s' }} />
            <FileText className="absolute top-1/3 left-1/3 h-5 w-5 text-primary/15 animate-float" style={{ animationDelay: '1s' }} />
            <FileText className="absolute top-2/3 right-1/4 h-9 w-9 text-primary/10 animate-float" style={{ animationDelay: '5s' }} />
          </div>
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-primary/25 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10 w-full">
            {/* File Upload in Hero */}
            <div className="max-w-4xl mx-auto">
              {/* Heading with gradient animation */}
              <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-blue-600 to-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent animate-fade-in-up">
                  Edit PDF
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                  Upload your PDF files to merge, split, compress, edit, and convert with professional-grade tools
                </p>
              </div>
              
              {/* Upload Box with enhanced animation */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-8 md:p-10 hover:border-primary/50 hover:shadow-primary/30 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 animate-fade-in-up relative overflow-hidden group" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <FileUpload
                  onFilesSelected={handleFilesChange}
                  maxFiles={10}
                />
              </div>
              
              {/* Quick Info with enhanced hover effects */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform cursor-pointer">
                  <Shield className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform cursor-pointer">
                  <Zap className="h-5 w-5 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <span className="font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform cursor-pointer">
                  <Clock className="h-5 w-5 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
                  <span className="font-medium">No Registration</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content - Full Width Focus */}
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <div className="w-full">
          {/* Live Editor Section - Show when files are loaded */}
          {files.length > 0 && (
            <div>
              {/* Header with File Selector and Clear Button - Full Width Toolbar */}
              <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {selectedFile?.name || 'Select a file'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {files.length} file{files.length > 1 ? 's' : ''} loaded
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiles([])
                      setSelectedFile(null)
                      setWatermarkSettings(null)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Clear All
                  </Button>
                </div>
                
                {/* File List - Horizontal Scroll */}
                {files.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {files.map((file, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedFile(file)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all flex-shrink-0 ${
                          selectedFile === file
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs opacity-70">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Area - Editor/Preview */}
              <div>
                {/* Live PDF Editor - Only show for PDF files */}
                {selectedFile && selectedFile.type === 'application/pdf' && (
                  <div className="bg-white dark:bg-slate-800" style={{ height: 'calc(100vh - 122px)' }}>
                    <LivePDFEditor
                      file={selectedFile}
                      allFiles={files}
                      onSave={(editData) => {
                        console.log('Saving edit data:', editData)
                      }}
                      onPreview={(previewData) => {
                        console.log('Preview data:', previewData)
                      }}
                    />
                  </div>
                )}

                {/* Simple Preview - Show for images and other files */}
                {selectedFile && selectedFile.type !== 'application/pdf' && (
                  <div className="bg-white dark:bg-slate-800" style={{ minHeight: '500px', height: 'calc(100vh - 122px)' }}>
                    <SimplePDFPreview 
                      file={selectedFile} 
                      files={files}
                      className="h-full" 
                      watermarkSettings={watermarkSettings} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State when no files - Show preview cards */}
          {files.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to Process Your PDFs?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Upload your PDF files above to get started with our powerful tools</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Merge PDFs</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Combine multiple files</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Scissors className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Split PDF</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Divide into pages</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Minimize2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Compress</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Reduce file size</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">OCR Text</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Extract text</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Transform Your PDFs Section - Moved below PDF Tools */}
      {files.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Transform Your PDFs with Ease
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
                Merge, split, compress, edit, and convert PDFs with our powerful online tools. 
                <span className="block mt-2 text-base md:text-lg font-medium text-primary">No registration required, completely free to use.</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    Process your PDFs in seconds with our optimized algorithms and cloud infrastructure
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    Your files are processed securely and automatically deleted after 1 hour for maximum privacy
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">No Registration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    Start using immediately without creating an account or providing personal information
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Everything You Need for PDF Management
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our comprehensive suite of tools covers all your PDF needs with professional-grade quality
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Merge PDFs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Combine multiple PDF files into a single document with custom page ordering
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Split PDFs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Split PDFs by page ranges or extract specific pages with precision
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Compress PDFs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Reduce file size while maintaining quality with advanced compression algorithms
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Edit PDFs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Rotate, delete, add text, watermarks, and rearrange pages with ease
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">OCR Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Extract text from images and scanned PDFs with multi-language support
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Image to PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Convert images to PDF documents with multiple page size options
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">PDF to Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Convert PDF pages to high-quality image files in various formats
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Batch Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    Process multiple files at once with progress tracking and queue management
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 OG PDF. All rights reserved.</p>
            <p className="text-sm mt-2">
              Developed with passion for seamless PDF management
            </p>
            <p className="text-sm mt-1 font-medium">
              By <a href="https://portfolio-seven-flame-s35fi4x2xg.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">Ali Zain</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
