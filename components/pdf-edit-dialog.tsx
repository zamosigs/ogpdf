'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { 
  RotateCw, 
  Trash2, 
  Type, 
  Image, 
  Lock, 
  Unlock,
  Download,
  Upload
} from 'lucide-react'

interface PDFEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (editData: any) => void
  fileName: string
}

export function PDFEditDialog({ open, onOpenChange, onConfirm, fileName }: PDFEditDialogProps) {
  const [editData, setEditData] = useState({
    // Rotation
    rotation: 0,
    
    // Page operations
    deletePages: '',
    keepPages: '',
    
    // Text operations
    addText: '',
    textX: 50,
    textY: 50,
    textSize: 12,
    textColor: '#000000',
    
    // Security
    password: '',
    confirmPassword: '',
    allowPrinting: true,
    allowCopying: true,
    allowModifying: false
  })

  const handleConfirm = () => {
    onConfirm(editData)
    onOpenChange(false)
  }

  const resetForm = () => {
    setEditData({
      rotation: 0,
      deletePages: '',
      keepPages: '',
      addText: '',
      textX: 50,
      textY: 50,
      textSize: 12,
      textColor: '#000000',
      password: '',
      confirmPassword: '',
      allowPrinting: true,
      allowCopying: true,
      allowModifying: false
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Edit PDF: {fileName}</span>
          </DialogTitle>
          <DialogDescription>
            Choose the editing operations you want to perform on your PDF
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Edit</TabsTrigger>
            <TabsTrigger value="text">Add Text</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Basic Edit Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <RotateCw className="h-4 w-4" />
                  <span>Basic PDF Operations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rotation">Rotate Pages</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[editData.rotation]}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, rotation: value[0] }))}
                        max={360}
                        step={90}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{editData.rotation}°</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rotate all pages by the specified angle</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deletePages">Delete Pages</Label>
                      <Input
                        id="deletePages"
                        placeholder="e.g., 1,3,5-7"
                        value={editData.deletePages}
                        onChange={(e) => setEditData(prev => ({ ...prev, deletePages: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Pages to remove (comma-separated or ranges)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keepPages">Keep Only Pages</Label>
                      <Input
                        id="keepPages"
                        placeholder="e.g., 2,4,6-8"
                        value={editData.keepPages}
                        onChange={(e) => setEditData(prev => ({ ...prev, keepPages: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Pages to keep (comma-separated or ranges)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span>Add Text to PDF</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="addText">Text Content</Label>
                  <Input
                    id="addText"
                    placeholder="Enter text to add to PDF"
                    value={editData.addText}
                    onChange={(e) => setEditData(prev => ({ ...prev, addText: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">The text that will be added to your PDF</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="textX">X Position (from left)</Label>
                    <Input
                      id="textX"
                      type="number"
                      placeholder="50"
                      value={editData.textX}
                      onChange={(e) => setEditData(prev => ({ ...prev, textX: parseInt(e.target.value) || 50 }))}
                    />
                    <p className="text-xs text-muted-foreground">Distance from left edge</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textY">Y Position (from top)</Label>
                    <Input
                      id="textY"
                      type="number"
                      placeholder="50"
                      value={editData.textY}
                      onChange={(e) => setEditData(prev => ({ ...prev, textY: parseInt(e.target.value) || 50 }))}
                    />
                    <p className="text-xs text-muted-foreground">Distance from top edge</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="textSize">Font Size</Label>
                    <Input
                      id="textSize"
                      type="number"
                      placeholder="12"
                      value={editData.textSize}
                      onChange={(e) => setEditData(prev => ({ ...prev, textSize: parseInt(e.target.value) || 12 }))}
                    />
                    <p className="text-xs text-muted-foreground">Size of the text (8-72)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={editData.textColor}
                        onChange={(e) => setEditData(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-12 h-10"
                      />
                      <Input
                        value={editData.textColor}
                        onChange={(e) => setEditData(prev => ({ ...prev, textColor: e.target.value }))}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Color of the text</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password Protection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password to protect PDF"
                      value={editData.password}
                      onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Set a password to protect your PDF</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={editData.confirmPassword}
                      onChange={(e) => setEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Re-enter the password to confirm</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Permissions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowPrinting">Allow Printing</Label>
                        <p className="text-xs text-muted-foreground">Users can print the PDF</p>
                      </div>
                      <Switch
                        id="allowPrinting"
                        checked={editData.allowPrinting}
                        onCheckedChange={(checked) => setEditData(prev => ({ ...prev, allowPrinting: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowCopying">Allow Copying</Label>
                        <p className="text-xs text-muted-foreground">Users can copy text from the PDF</p>
                      </div>
                      <Switch
                        id="allowCopying"
                        checked={editData.allowCopying}
                        onCheckedChange={(checked) => setEditData(prev => ({ ...prev, allowCopying: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowModifying">Allow Modifying</Label>
                        <p className="text-xs text-muted-foreground">Users can edit the PDF</p>
                      </div>
                      <Switch
                        id="allowModifying"
                        checked={editData.allowModifying}
                        onCheckedChange={(checked) => setEditData(prev => ({ ...prev, allowModifying: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
              Apply Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
