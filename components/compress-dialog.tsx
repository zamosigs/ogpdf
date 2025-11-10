'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Minimize2, Info } from 'lucide-react'

interface CompressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (compressData: any) => void
  fileName: string
}

export function CompressDialog({ open, onOpenChange, onConfirm, fileName }: CompressDialogProps) {
  const [compressData, setCompressData] = useState({
    quality: 80, // Store as percentage (10-100)
    compressionLevel: 'medium'
  })

  const compressionLevels = [
    { value: 'low', label: 'Low (Max Compression)', quality: 50, info: 'Smallest file size - uses maximum object stream compression' },
    { value: 'medium', label: 'Medium (Balanced)', quality: 80, info: 'Good balance between size and quality' },
    { value: 'high', label: 'High (Better Quality)', quality: 95, info: 'Minimal compression - preserves quality' },
  ]

  const handleLevelChange = (level: string) => {
    const selected = compressionLevels.find(l => l.value === level)
    if (selected) {
      setCompressData(prev => ({
        ...prev,
        compressionLevel: level,
        quality: selected.quality
      }))
    }
  }

  const handleConfirm = () => {
    onConfirm(compressData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setCompressData({
      quality: 80,
      compressionLevel: 'medium'
    })
  }

  const selectedLevel = compressionLevels.find(l => l.value === compressData.compressionLevel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center space-x-2">
            <Minimize2 className="h-5 w-5" />
            <span>Compress PDF</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Reduce file size: {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Compression Level Preset */}
          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-medium">Compression Level</Label>
            <Select
              value={compressData.compressionLevel}
              onValueChange={handleLevelChange}
            >
              <SelectTrigger>
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
            {selectedLevel && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {selectedLevel.info}
                </p>
              </div>
            )}
          </div>

          {/* Quality Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quality" className="text-sm font-medium">PDF Quality</Label>
              <span className="text-sm font-mono text-muted-foreground">{compressData.quality}%</span>
            </div>
            <Slider
              id="quality"
              min={10}
              max={100}
              step={5}
              value={[compressData.quality]}
              onValueChange={(value) => setCompressData(prev => ({ ...prev, quality: value[0] }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          {/* Info about compression */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-medium mb-1">How compression works:</p>
                <p>Optimizes PDF structure using object stream compression. Results vary depending on the original PDF's compression state.</p>
              </div>
            </div>
          </div>

          {/* Estimated Results */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Target quality:</span>
                <span className="font-medium">{compressData.quality}%</span>
              </div>
              <div className="flex justify-between">
                <span>Compression level:</span>
                <span className="font-medium capitalize">{compressData.compressionLevel}</span>
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
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700" size="sm">
              Compress
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
