'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Droplets } from 'lucide-react'

interface WatermarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (watermarkData: any) => void
  onChange?: (watermarkSettings: {
    text: string
    fontSize: number
    color: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    angle: number
  } | null) => void
  fileName: string
}

export function WatermarkDialog({ open, onOpenChange, onConfirm, onChange, fileName }: WatermarkDialogProps) {
  const [watermarkData, setWatermarkData] = useState({
    text: '',
    fontSize: 24,
    color: '#000000',
    opacity: 0.5,
    position: 'center' as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    angle: 0,
    fontFamily: 'Helvetica',
    fontWeight: 'normal',
    applyToAllPages: true,
    pageRange: '',
    addTimestamp: false,
    addPageNumbers: false
  })

  // Notify parent of watermark changes for live preview
  React.useEffect(() => {
    if (open && onChange && watermarkData.text) {
      onChange({
        text: watermarkData.text,
        fontSize: watermarkData.fontSize,
        color: watermarkData.color,
        opacity: watermarkData.opacity,
        position: watermarkData.position,
        angle: watermarkData.angle
      })
    } else if (!open && onChange) {
      onChange(null) // Clear watermark when dialog closes
    }
  }, [open, watermarkData.text, watermarkData.fontSize, watermarkData.color, watermarkData.opacity, watermarkData.position, watermarkData.angle, onChange])

  const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ]

  const fontFamilies = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times-Roman', label: 'Times Roman' },
    { value: 'Courier', label: 'Courier' }
  ]

  const handleConfirm = () => {
    onConfirm(watermarkData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setWatermarkData({
      text: '',
      fontSize: 24,
      color: '#000000',
      opacity: 0.5,
      position: 'center',
      angle: 0,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      applyToAllPages: true,
      pageRange: '',
      addTimestamp: false,
      addPageNumbers: false
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center space-x-2">
            <Droplets className="h-5 w-5" />
            <span>Add Watermark</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure watermark for: {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Watermark Text */}
          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium">Watermark Text</Label>
            <Input
              id="text"
              placeholder="Enter watermark text"
              value={watermarkData.text}
              onChange={(e) => setWatermarkData(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>

          {/* Font Settings - 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fontSize" className="text-sm font-medium">Font Size</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fontSize"
                  type="number"
                  min="8"
                  max="72"
                  value={watermarkData.fontSize}
                  onChange={(e) => setWatermarkData(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 24 }))}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily" className="text-sm font-medium">Font</Label>
              <Select
                value={watermarkData.fontFamily}
                onValueChange={(value) => setWatermarkData(prev => ({ ...prev, fontFamily: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color and Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="color" className="text-sm font-medium">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={watermarkData.color}
                  onChange={(e) => setWatermarkData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-9"
                />
                <span className="text-xs text-muted-foreground">{watermarkData.color}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-medium">Position</Label>
              <Select
                value={watermarkData.position}
                onValueChange={(value) => setWatermarkData(prev => ({ ...prev, position: value as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Opacity</Label>
              <span className="text-sm font-mono text-muted-foreground">{Math.round(watermarkData.opacity * 100)}%</span>
            </div>
            <Slider
              value={[watermarkData.opacity]}
              onValueChange={(value) => setWatermarkData(prev => ({ ...prev, opacity: value[0] }))}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rotation</Label>
              <span className="text-sm font-mono text-muted-foreground">{watermarkData.angle}°</span>
            </div>
            <Slider
              value={[watermarkData.angle]}
              onValueChange={(value) => setWatermarkData(prev => ({ ...prev, angle: value[0] }))}
              max={360}
              step={15}
              className="w-full"
            />
          </div>

          {/* Divider */}
          <div className="border-t pt-3 mt-3">
            <Label className="text-sm font-medium mb-3 block">Page Options</Label>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="applyToAllPages" className="text-sm font-normal cursor-pointer">Apply to All Pages</Label>
                <Switch
                  id="applyToAllPages"
                  checked={watermarkData.applyToAllPages}
                  onCheckedChange={(checked) => setWatermarkData(prev => ({ ...prev, applyToAllPages: checked }))}
                />
              </div>

              {!watermarkData.applyToAllPages && (
                <div className="space-y-1 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <Label htmlFor="pageRange" className="text-sm font-normal">Page Range</Label>
                  <Input
                    id="pageRange"
                    placeholder="e.g., 1-3,5,7-9"
                    value={watermarkData.pageRange}
                    onChange={(e) => setWatermarkData(prev => ({ ...prev, pageRange: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="addTimestamp" className="text-sm font-normal cursor-pointer">Add Timestamp</Label>
                <Switch
                  id="addTimestamp"
                  checked={watermarkData.addTimestamp}
                  onCheckedChange={(checked) => setWatermarkData(prev => ({ ...prev, addTimestamp: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="addPageNumbers" className="text-sm font-normal cursor-pointer">Add Page Numbers</Label>
                <Switch
                  id="addPageNumbers"
                  checked={watermarkData.addPageNumbers}
                  onCheckedChange={(checked) => setWatermarkData(prev => ({ ...prev, addPageNumbers: checked }))}
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
            <Button onClick={handleConfirm} className="bg-orange-600 hover:bg-orange-700" size="sm">
              Add Watermark
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
