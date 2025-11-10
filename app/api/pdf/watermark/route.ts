import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const text = formData.get('text') as string
    const position = formData.get('position') as string || 'center'
    const opacity = parseFloat(formData.get('opacity') as string) || 0.3
    const fontSize = parseInt(formData.get('fontSize') as string) || 48
    const color = formData.get('color') as string || 'gray'

    if (!file || file.type !== 'application/pdf') {
      return createErrorResponse('Valid PDF file is required', 400)
    }

    if (!text) {
      return createErrorResponse('Watermark text is required', 400)
    }

    if (opacity < 0.1 || opacity > 1.0) {
      return createErrorResponse('Opacity must be between 0.1 and 1.0', 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const font = await pdf.embedFont(StandardFonts.HelveticaBold)

    // Parse color
    let textColor = rgb(0.5, 0.5, 0.5) // default gray
    if (color === 'red') textColor = rgb(1, 0, 0)
    else if (color === 'blue') textColor = rgb(0, 0, 1)
    else if (color === 'green') textColor = rgb(0, 1, 0)
    else if (color === 'black') textColor = rgb(0, 0, 0)

    // Add watermark to all pages
    const pages = pdf.getPages()
    pages.forEach((page) => {
      const { width, height } = page.getSize()
      
      let x, y
      switch (position) {
        case 'top-left':
          x = 50
          y = height - 100
          break
        case 'top-right':
          x = width - 200
          y = height - 100
          break
        case 'bottom-left':
          x = 50
          y = 100
          break
        case 'bottom-right':
          x = width - 200
          y = 100
          break
        case 'center':
        default:
          x = width / 2 - (text.length * fontSize * 0.3)
          y = height / 2
          break
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: font,
        color: textColor,
        opacity: opacity,
        rotate: { type: 'degrees', angle: -45 } as any,
      })
    })

    // Save the modified PDF
    const pdfBytes = await pdf.save()
    const filename = `watermarked_${Date.now()}.pdf`
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
    console.error('Error adding watermark:', error)
    return createErrorResponse('Failed to add watermark', 500)
  }
}
