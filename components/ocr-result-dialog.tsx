'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Download, CheckCircle2, FileText, Code } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface OCRResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: {
    text: string
    confidence: number
    wordCount: number
    characterCount: number
    language: string
    fileName: string
  } | null
}

export function OCRResultDialog({ open, onOpenChange, result }: OCRResultDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result.text], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ocr_${result.fileName.split('.')[0]}_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Text file saved successfully",
    })
  }

  const jsonResult = {
    fileName: result.fileName,
    language: result.language,
    confidence: `${result.confidence}%`,
    statistics: {
      words: result.wordCount,
      characters: result.characterCount
    },
    extractedText: result.text
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6 text-green-600" />
            <span>OCR Result</span>
          </DialogTitle>
          <DialogDescription>
            Text extracted from: {result.fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Stats Panel */}
            <div className="space-y-4 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="text-lg font-bold text-green-600">{result.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Words</span>
                    <span className="text-lg font-semibold">{result.wordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Characters</span>
                    <span className="text-lg font-semibold">{result.characterCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Language</span>
                    <span className="text-lg font-semibold uppercase">{result.language}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={handleCopy} 
                    className="w-full"
                    variant={copied ? "default" : "outline"}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as TXT
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Text Display Panel */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <Tabs defaultValue="text" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">
                        <FileText className="h-4 w-4 mr-2" />
                        Text
                      </TabsTrigger>
                      <TabsTrigger value="json">
                        <Code className="h-4 w-4 mr-2" />
                        JSON
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-4">
                      <div className="relative">
                        <textarea
                          value={result.text}
                          readOnly
                          className="w-full h-[500px] p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary text-black dark:text-white bg-white dark:bg-slate-900"
                          style={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={handleCopy}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="json" className="mt-4">
                      <div className="relative">
                        <textarea
                          value={JSON.stringify(jsonResult, null, 2)}
                          readOnly
                          className="w-full h-[500px] p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary text-black dark:text-white bg-slate-50 dark:bg-slate-900"
                          style={{ 
                            whiteSpace: 'pre',
                            wordBreak: 'break-word'
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(jsonResult, null, 2))
                            toast({
                              title: "Copied!",
                              description: "JSON copied to clipboard",
                            })
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
