'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { FileImage } from 'lucide-react'

interface PDFToImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (conversionData: any) => void
  fileName: string
}

export function PDFToImagesDialog({ open, onOpenChange, onConfirm, fileName }: PDFToImagesDialogProps) {
  const [conversionData, setConversionData] = useState({
    format: 'jpeg',
    quality: 90,
    dpi: 150,
    pageRange: '',
    outputFormat: 'zip',
    includeMetadata: true,
    addPageNumbers: false,
    resizeImages: false,
    maxWidth: 1920,
    maxHeight: 1080
  })

  const formats = [
    { value: 'jpeg', label: 'JPEG (.jpg)' },
    { value: 'png', label: 'PNG (.png)' },
    { value: 'webp', label: 'WebP (.webp)' },
    { value: 'tiff', label: 'TIFF (.tiff)' }
  ]

  const outputFormats = [
    { value: 'zip', label: 'ZIP Archive' },
    { value: 'individual', label: 'Individual Files' }
  ]

  const handleConfirm = () => {
    onConfirm(conversionData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setConversionData({
      format: 'jpeg',
      quality: 90,
      dpi: 150,
      pageRange: '',
      outputFormat: 'zip',
      includeMetadata: true,
      addPageNumbers: false,
      resizeImages: false,
      maxWidth: 1920,
      maxHeight: 1080
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            Convert PDF to Images
          </DialogTitle>
          <DialogDescription>
            Extract pages from <span className="font-medium">{fileName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {/* Image Format & Quality */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="format" className="text-sm font-medium">Image Format</Label>
                <Select
                  value={conversionData.format}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger id="format" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputFormat" className="text-sm font-medium">Output</Label>
                <Select
                  value={conversionData.outputFormat}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, outputFormat: value }))}
                >
                  <SelectTrigger id="outputFormat" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {outputFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quality" className="text-sm font-medium flex items-center justify-between">
                  Quality
                  <span className="text-xs text-muted-foreground">{conversionData.quality}%</span>
                </Label>
                <Input
                  id="quality"
                  type="range"
                  min="10"
                  max="100"
                  value={conversionData.quality}
                  onChange={(e) => setConversionData(prev => ({ ...prev, quality: parseInt(e.target.value) || 90 }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpi" className="text-sm font-medium flex items-center justify-between">
                  DPI
                  <span className="text-xs text-muted-foreground">{conversionData.dpi}</span>
                </Label>
                <Input
                  id="dpi"
                  type="range"
                  min="72"
                  max="600"
                  step="50"
                  value={conversionData.dpi}
                  onChange={(e) => setConversionData(prev => ({ ...prev, dpi: parseInt(e.target.value) || 150 }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageRange" className="text-sm font-medium">Page Range (optional)</Label>
              <Input
                id="pageRange"
                placeholder="e.g., 1-3,5,7-9 or leave empty for all"
                value={conversionData.pageRange}
                onChange={(e) => setConversionData(prev => ({ ...prev, pageRange: e.target.value }))}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to convert all pages
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeMetadata" className="text-sm font-medium">Include Metadata</Label>
              <Switch
                id="includeMetadata"
                checked={conversionData.includeMetadata}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, includeMetadata: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="addPageNumbers" className="text-sm font-medium">Add Page Numbers to Filenames</Label>
              <Switch
                id="addPageNumbers"
                checked={conversionData.addPageNumbers}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, addPageNumbers: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="resizeImages" className="text-sm font-medium">Resize Images</Label>
              <Switch
                id="resizeImages"
                checked={conversionData.resizeImages}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, resizeImages: checked }))}
              />
            </div>
          </div>

          {/* Resize Options */}
          {conversionData.resizeImages && (
            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-primary/30">
              <div className="space-y-2">
                <Label htmlFor="maxWidth" className="text-sm font-medium">Max Width</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  min="100"
                  max="4000"
                  value={conversionData.maxWidth}
                  onChange={(e) => setConversionData(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHeight" className="text-sm font-medium">Max Height</Label>
                <Input
                  id="maxHeight"
                  type="number"
                  min="100"
                  max="4000"
                  value={conversionData.maxHeight}
                  onChange={(e) => setConversionData(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 1080 }))}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={resetForm}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
              Convert to Images
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
