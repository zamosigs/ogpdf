import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const pageSize = formData.get('pageSize') as string || 'A4'

    if (!files || files.length === 0) {
      return createErrorResponse('At least one image file is required', 400)
    }

    // Validate all files are images
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return createErrorResponse('All files must be image format', 400)
      }
    }

    // Create a new PDF document
    const pdf = await PDFDocument.create()
    
    // Define page sizes
    const pageSizes = {
      'A4': { width: 595, height: 842 },
      'A3': { width: 842, height: 1191 },
      'Letter': { width: 612, height: 792 },
      'Legal': { width: 612, height: 1008 }
    }

    const selectedSize = pageSizes[pageSize as keyof typeof pageSizes] || pageSizes.A4

    // Process each image file
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      
      // Process image with Sharp
      const processedImage = await sharp(imageBuffer)
        .resize(selectedSize.width, selectedSize.height, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 90 })
        .toBuffer()

      // Embed image in PDF
      const image = await pdf.embedJpg(processedImage)
      const page = pdf.addPage([selectedSize.width, selectedSize.height])
      
      // Calculate image dimensions to fit page
      const imageAspectRatio = image.width / image.height
      const pageAspectRatio = selectedSize.width / selectedSize.height
      
      let imageWidth, imageHeight, x, y
      
      if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page
        imageWidth = selectedSize.width
        imageHeight = selectedSize.width / imageAspectRatio
        x = 0
        y = (selectedSize.height - imageHeight) / 2
      } else {
        // Image is taller than page
        imageHeight = selectedSize.height
        imageWidth = selectedSize.height * imageAspectRatio
        x = (selectedSize.width - imageWidth) / 2
        y = 0
      }
      
      page.drawImage(image, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
      })
    }

    // Generate the PDF
    const pdfBytes = await pdf.save()
    
    // Save to temporary file
    const filename = `converted_${Date.now()}.pdf`
    const filePath = getTempFilePath(filename)
    await writeFile(filePath, pdfBytes)

    // Schedule cleanup after 1 hour
    setTimeout(() => cleanupFile(filename), 60 * 60 * 1000)

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error converting images to PDF:', error)
    return createErrorResponse('Failed to convert images to PDF', 500)
  }
}
