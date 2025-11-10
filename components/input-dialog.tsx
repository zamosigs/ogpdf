'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  placeholder?: string
  label?: string
  defaultValue?: string
  onConfirm: (value: string) => void
  confirmText?: string
  cancelText?: string
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "",
  label = "Input",
  defaultValue = "",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel"
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue)

  const handleConfirm = () => {
    onConfirm(value)
    onOpenChange(false)
    setValue(defaultValue)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setValue(defaultValue)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="input" className="text-right font-medium">
              {label}
            </Label>
            <Input
              id="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="col-span-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm()
                }
                if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
