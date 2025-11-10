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
    { value: 'portrait', label: '📄 Portrait' },
    { value: 'landscape', label: '📃 Landscape' }
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
      fitToPage: true,
      centerImages: true,
      addPageNumbers: false,
      addTimestamp: false,
      outputName: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Images to PDF Converter
          </DialogTitle>
          <DialogDescription className="text-base">
            Convert <span className="font-semibold text-primary">{fileCount}</span> image{fileCount > 1 ? 's' : ''} into a single PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Tip */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>💡 Tip:</strong> Images will maintain their aspect ratio and be optimized for the selected page size
            </p>
          </div>

          {/* Page Configuration */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pageSize" className="text-sm font-medium">📐 Page Size</Label>
                <Select
                  value={conversionData.pageSize}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, pageSize: value }))}
                >
                  <SelectTrigger id="pageSize" className="h-10">
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
                <Label htmlFor="orientation" className="text-sm font-medium">🔄 Orientation</Label>
                <Select
                  value={conversionData.orientation}
                  onValueChange={(value) => setConversionData(prev => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger id="orientation" className="h-10">
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

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="margin" className="text-sm font-medium flex items-center justify-between">
                  📏 Margin
                  <span className="text-xs font-normal text-muted-foreground">{conversionData.margin}px</span>
                </Label>
                <input
                  id="margin"
                  type="range"
                  min="0"
                  max="50"
                  value={conversionData.margin}
                  onChange={(e) => setConversionData(prev => ({ ...prev, margin: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality" className="text-sm font-medium flex items-center justify-between">
                  ✨ Quality
                  <span className="text-xs font-normal text-muted-foreground">{conversionData.quality}%</span>
                </Label>
                <input
                  id="quality"
                  type="range"
                  min="50"
                  max="100"
                  value={conversionData.quality}
                  onChange={(e) => setConversionData(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-2.5 border-t pt-3">
            <Label className="text-sm font-medium text-muted-foreground">Layout Options</Label>
            
            <div className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <Label htmlFor="fitToPage" className="text-sm cursor-pointer flex items-center gap-2">
                <span>📐</span>
                <span>Fit Images to Page</span>
              </Label>
              <Switch
                id="fitToPage"
                checked={conversionData.fitToPage}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, fitToPage: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <Label htmlFor="centerImages" className="text-sm cursor-pointer flex items-center gap-2">
                <span>⊙</span>
                <span>Center Images</span>
              </Label>
              <Switch
                id="centerImages"
                checked={conversionData.centerImages}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, centerImages: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <Label htmlFor="addPageNumbers" className="text-sm cursor-pointer flex items-center gap-2">
                <span>#️⃣</span>
                <span>Add Page Numbers</span>
              </Label>
              <Switch
                id="addPageNumbers"
                checked={conversionData.addPageNumbers}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, addPageNumbers: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <Label htmlFor="addTimestamp" className="text-sm cursor-pointer flex items-center gap-2">
                <span>🕐</span>
                <span>Add Timestamp</span>
              </Label>
              <Switch
                id="addTimestamp"
                checked={conversionData.addTimestamp}
                onCheckedChange={(checked) => setConversionData(prev => ({ ...prev, addTimestamp: checked }))}
              />
            </div>
          </div>

          {/* Output Name */}
          <div className="space-y-2 border-t pt-3">
            <Label htmlFor="outputName" className="text-sm font-medium flex items-center gap-2">
              <span>📝</span>
              <span>Custom Filename (optional)</span>
            </Label>
            <Input
              id="outputName"
              placeholder="my-document.pdf"
              value={conversionData.outputName}
              onChange={(e) => setConversionData(prev => ({ ...prev, outputName: e.target.value }))}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Leave empty to use default filename</p>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetForm} 
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            🔄 Reset
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleConfirm} 
              className="bg-primary hover:bg-primary/90 font-semibold px-6"
              disabled={fileCount === 0}
            >
              📄 Convert to PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
