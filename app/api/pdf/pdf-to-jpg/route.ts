import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Get the rendered images from client
    const imagesData = formData.get('images') as string
    const format = formData.get('format') as string || 'jpeg'
    
    if (!imagesData) {
      return createErrorResponse('No images data provided', 400)
    }

    // Parse the images data (comes as JSON from client)
    const images = JSON.parse(imagesData) as Array<{ pageNum: number, dataUrl: string }>

    if (images.length === 0) {
      return createErrorResponse('No images to process', 400)
    }

    const zip = new JSZip()

    // Process each image
    for (const imageData of images) {
      // Convert data URL to buffer
      const base64Data = imageData.dataUrl.split(',')[1]
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      const filename = `page_${imageData.pageNum.toString().padStart(3, '0')}.${format}`
      zip.file(filename, imageBuffer)
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipFilename = `pdf_to_images_${Date.now()}.zip`
    const zipPath = getTempFilePath(zipFilename)
    await writeFile(zipPath, zipBuffer)

    // Schedule cleanup after 1 hour
    setTimeout(() => cleanupFile(zipFilename), 60 * 60 * 1000)

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error creating ZIP from images:', error)
    return createErrorResponse('Failed to create ZIP file', 500)
  }
}