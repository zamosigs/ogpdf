'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, Download, Settings, Languages } from 'lucide-react'

interface OCRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (ocrData: any) => void
  fileName: string
}

export function OCRDialog({ open, onOpenChange, onConfirm, fileName }: OCRDialogProps) {
  const [ocrData, setOcrData] = useState({
    language: 'eng',
    confidence: 80,
    outputFormat: 'txt',
    includeConfidence: true,
    includeWordCount: true,
    includeCharacterCount: true,
    preprocess: true,
    enhanceImage: true
  })

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ben', name: 'Bengali' },
    { code: 'tam', name: 'Tamil' },
    { code: 'tel', name: 'Telugu' },
    { code: 'mar', name: 'Marathi' },
    { code: 'guj', name: 'Gujarati' },
    { code: 'kan', name: 'Kannada' },
    { code: 'mal', name: 'Malayalam' }
  ]

  const handleConfirm = () => {
    onConfirm(ocrData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setOcrData({
      language: 'eng',
      confidence: 80,
      outputFormat: 'txt',
      includeConfidence: true,
      includeWordCount: true,
      includeCharacterCount: true,
      preprocess: true,
      enhanceImage: true
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>OCR Settings</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Extract text from: {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium">Document Language</Label>
            <Select
              value={ocrData.language}
              onValueChange={(value) => setOcrData(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <Label htmlFor="confidence" className="text-sm font-medium">Confidence Threshold</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={ocrData.confidence}
                onChange={(e) => setOcrData(prev => ({ ...prev, confidence: parseInt(e.target.value) || 80 }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">% (0-100)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher values require more confident text recognition
            </p>
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label htmlFor="outputFormat" className="text-sm font-medium">Output Format</Label>
            <Select
              value={ocrData.outputFormat}
              onValueChange={(value) => setOcrData(prev => ({ ...prev, outputFormat: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Text File (.txt)</SelectItem>
                <SelectItem value="docx">Word Document (.docx)</SelectItem>
                <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options - Collapsible/Compact */}
          <div className="pt-2 border-t">
            <Label className="text-sm font-medium mb-3 block">Advanced Options</Label>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="preprocess" className="text-sm font-normal cursor-pointer">Image Preprocessing</Label>
                <Switch
                  id="preprocess"
                  checked={ocrData.preprocess}
                  onCheckedChange={(checked) => setOcrData(prev => ({ ...prev, preprocess: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enhanceImage" className="text-sm font-normal cursor-pointer">Image Enhancement</Label>
                <Switch
                  id="enhanceImage"
                  checked={ocrData.enhanceImage}
                  onCheckedChange={(checked) => setOcrData(prev => ({ ...prev, enhanceImage: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeConfidence" className="text-sm font-normal cursor-pointer">Include Confidence Scores</Label>
                <Switch
                  id="includeConfidence"
                  checked={ocrData.includeConfidence}
                  onCheckedChange={(checked) => setOcrData(prev => ({ ...prev, includeConfidence: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeWordCount" className="text-sm font-normal cursor-pointer">Include Word Count</Label>
                <Switch
                  id="includeWordCount"
                  checked={ocrData.includeWordCount}
                  onCheckedChange={(checked) => setOcrData(prev => ({ ...prev, includeWordCount: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeCharacterCount" className="text-sm font-normal cursor-pointer">Include Character Count</Label>
                <Switch
                  id="includeCharacterCount"
                  checked={ocrData.includeCharacterCount}
                  onCheckedChange={(checked) => setOcrData(prev => ({ ...prev, includeCharacterCount: checked }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between flex-row gap-2">
          <Button variant="outline" onClick={resetForm} size="sm">
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700" size="sm">
              Extract Text
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
