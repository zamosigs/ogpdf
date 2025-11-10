import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    // Get all conversion parameters
    const pageSize = formData.get('pageSize') as string || 'A4'
    const orientation = formData.get('orientation') as string || 'portrait'
    const margin = parseInt(formData.get('margin') as string || '20')
    const quality = parseInt(formData.get('quality') as string || '90')
    const fitToPage = formData.get('fitToPage') === 'true'
    const centerImages = formData.get('centerImages') === 'true'
    const addPageNumbers = formData.get('addPageNumbers') === 'true'
    const addTimestamp = formData.get('addTimestamp') === 'true'

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
    const pageSizes: Record<string, { width: number, height: number }> = {
      'A4': { width: 595, height: 842 },
      'A3': { width: 842, height: 1191 },
      'A5': { width: 420, height: 595 },
      'Letter': { width: 612, height: 792 },
      'Legal': { width: 612, height: 1008 },
      'Tabloid': { width: 792, height: 1224 }
    }

    let selectedSize = pageSizes[pageSize] || pageSizes.A4
    
    // Apply orientation
    if (orientation === 'landscape') {
      selectedSize = { width: selectedSize.height, height: selectedSize.width }
    }

    // Process each image file
    let pageNumber = 1
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata()
      
      // Calculate target size based on page and margin
      const maxWidth = selectedSize.width - (margin * 2)
      const maxHeight = selectedSize.height - (margin * 2) - (addPageNumbers || addTimestamp ? 40 : 0) // Reserve space for text
      
      // Process image with Sharp - convert to PNG for better quality
      const processedImage = await sharp(imageBuffer)
        .resize(Math.floor(maxWidth), Math.floor(maxHeight), { 
          fit: fitToPage ? 'inside' : 'contain',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality, compressionLevel: 6 })
        .toBuffer()

      // Embed image in PDF
      const image = await pdf.embedPng(processedImage)
      const page = pdf.addPage([selectedSize.width, selectedSize.height])
      
      // Calculate image dimensions and position
      const imageAspectRatio = image.width / image.height
      const pageAspectRatio = maxWidth / maxHeight
      
      let imageWidth, imageHeight, x, y
      
      if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page
        imageWidth = maxWidth
        imageHeight = maxWidth / imageAspectRatio
      } else {
        // Image is taller than page
        imageHeight = maxHeight
        imageWidth = maxHeight * imageAspectRatio
      }
      
      // Calculate position
      if (centerImages) {
        x = margin + (maxWidth - imageWidth) / 2
        y = margin + (maxHeight - imageHeight) / 2
      } else {
        x = margin
        y = margin
      }
      
      // Draw the image
      page.drawImage(image, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
      })
      
      // Add page numbers if requested
      if (addPageNumbers) {
        const font = await pdf.embedFont(StandardFonts.Helvetica)
        const pageNumText = `Page ${pageNumber} of ${files.length}`
        const textWidth = font.widthOfTextAtSize(pageNumText, 10)
        
        page.drawText(pageNumText, {
          x: (selectedSize.width - textWidth) / 2,
          y: 15,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })
      }
      
      // Add timestamp if requested
      if (addTimestamp) {
        const font = await pdf.embedFont(StandardFonts.Helvetica)
        const timestamp = new Date().toLocaleString()
        const timestampText = `Created: ${timestamp}`
        
        page.drawText(timestampText, {
          x: margin,
          y: selectedSize.height - margin + 5,
          size: 8,
          font,
          color: rgb(0.6, 0.6, 0.6),
        })
      }
      
      pageNumber++
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
