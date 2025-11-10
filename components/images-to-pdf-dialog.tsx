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
import { Image } from 'lucide-react'

interface ImagesToPDFDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (conversionData: any) => void
  fileCount: number
}

export function ImagesToPDFDialog({ open, onOpenChange, onConfirm, fileCount }: ImagesToPDFDialogProps) {
  const [conversionData, setConversionData] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 20,
    quality: 90,
    compression: 'medium',
    fitToPage: true,
    centerImages: true,
    addPageNumbers: false,
    addTimestamp: false,
    outputName: ''
  })

  const pageSizes = [
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'A3', label: 'A3 (297 × 420 mm)' },
    { value: 'A5', label: 'A5 (148 × 210 mm)' },
    { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'Legal', label: 'Legal (8.5 × 14 in)' },
    { value: 'Tabloid', label: 'Tabloid (11 × 17 in)' }
  ]

  const orientations = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' }
  ]

  const compressionLevels = [
    { value: 'low', label: 'Low (Larger file, better quality)' },
    { value: 'medium', label: 'Medium (Balanced)' },
    { value: 'high', label: 'High (Smaller file, lower quality)' }
  ]

  const handleConfirm = () => {
    onConfirm(conversionData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setConversionData({
      pageSize: 'A4',
      orientation: 'portrait',
      margin: 20,
      quality: 90,
      compression: 'medium',
      fitToPage: true,
      centerImages: true,
      addPageNumbers: false,
      addTimestamp: false,
      outputName: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Convert Images to PDF
          </DialogTitle>
          <DialogDescription>
            Converting {fileCount} image{fileCount > 1 ? 's' : ''} to PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {/* Page Settings */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pageSize" className="text-sm font-medium">Page Size</Label>
                <Select
                  value={conversionData.pageSize}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, pageSize: value }))}
                >
                  <SelectTrigger id="pageSize" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation" className="text-sm font-medium">Orientation</Label>
                <Select
                  value={conversionData.orientation}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger id="orientation" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orientations.map((orientation) => (
                      <SelectItem key={orientation.value} value={orientation.value}>
                        {orientation.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="margin" className="text-sm font-medium flex items-center justify-between">
                  Margin
                  <span className="text-xs text-muted-foreground">{conversionData.margin}mm</span>
                </Label>
                <Input
                  id="margin"
                  type="range"
                  min="0"
                  max="50"
                  value={conversionData.margin}
                  onChange={(e) => setConversionData(prev => ({ ...prev, margin: parseInt(e.target.value) || 20 }))}
                  className="w-full"
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="compression" className="text-sm font-medium">Compression</Label>
              <Select
                value={conversionData.compression}
                onValueChange={(value) => setConversionData(prev => ({ ...prev, compression: value }))}
              >
                <SelectTrigger id="compression" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {compressionLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-2.5 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fitToPage" className="text-sm font-medium">Fit Images to Page</Label>
              <Switch
                id="fitToPage"
                checked={conversionData.fitToPage}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, fitToPage: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="centerImages" className="text-sm font-medium">Center Images</Label>
              <Switch
                id="centerImages"
                checked={conversionData.centerImages}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, centerImages: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="addPageNumbers" className="text-sm font-medium">Add Page Numbers</Label>
              <Switch
                id="addPageNumbers"
                checked={conversionData.addPageNumbers}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, addPageNumbers: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="addTimestamp" className="text-sm font-medium">Add Timestamp</Label>
              <Switch
                id="addTimestamp"
                checked={conversionData.addTimestamp}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, addTimestamp: checked }))}
              />
            </div>
          </div>

          {/* Output Name */}
          <div className="space-y-2 border-t pt-3">
            <Label htmlFor="outputName" className="text-sm font-medium">Custom Filename (optional)</Label>
            <Input
              id="outputName"
              placeholder="Leave empty for default"
              value={conversionData.outputName}
              onChange={(e) => setConversionData(prev => ({ ...prev, outputName: e.target.value }))}
              className="h-9"
            />
          </div>
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
              Convert to PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
