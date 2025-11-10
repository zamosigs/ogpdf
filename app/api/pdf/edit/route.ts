import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string
    const pageNumber = parseInt(formData.get('pageNumber') as string) || 1
    const text = formData.get('text') as string || ''
    const x = parseFloat(formData.get('x') as string) || 0
    const y = parseFloat(formData.get('y') as string) || 0
    const rotation = parseInt(formData.get('rotation') as string) || 0

    if (!file || file.type !== 'application/pdf') {
      return createErrorResponse('Valid PDF file is required', 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const totalPages = pdf.getPageCount()

    if (pageNumber < 1 || pageNumber > totalPages) {
      return createErrorResponse(`Invalid page number. Must be between 1 and ${totalPages}`, 400)
    }

    const pageIndex = pageNumber - 1
    const page = pdf.getPage(pageIndex)

    switch (action) {
      case 'rotate':
        if (rotation !== 0 && rotation !== 90 && rotation !== 180 && rotation !== 270) {
          return createErrorResponse('Rotation must be 0, 90, 180, or 270 degrees', 400)
        }
        page.setRotation({ type: 'degrees' as any, angle: page.getRotation().angle + rotation })
        break

      case 'delete':
        pdf.removePage(pageIndex)
        break

      case 'duplicate':
        const duplicatedPage = await pdf.copyPages(pdf, [pageIndex])
        pdf.insertPage(pageIndex + 1, duplicatedPage[0])
        break

      case 'addText':
        if (!text) {
          return createErrorResponse('Text is required for addText action', 400)
        }
        const font = await pdf.embedFont(StandardFonts.Helvetica)
        page.drawText(text, {
          x: x,
          y: y,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        })
        break

      case 'addWatermark':
        if (!text) {
          return createErrorResponse('Watermark text is required', 400)
        }
        const watermarkFont = await pdf.embedFont(StandardFonts.HelveticaBold)
        const { width, height } = page.getSize()
        
        // Add semi-transparent watermark
        page.drawText(text, {
          x: width / 2 - (text.length * 6),
          y: height / 2,
          size: 48,
          font: watermarkFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.3,
          rotate: { type: 'degrees', angle: -45 } as any,
        })
        break

      case 'rearrange':
        const newOrder = formData.get('newOrder') as string
        if (!newOrder) {
          return createErrorResponse('New page order is required for rearrange action', 400)
        }
        
        const orderArray = newOrder.split(',').map(num => parseInt(num.trim()) - 1)
        if (orderArray.length !== totalPages) {
          return createErrorResponse('New order must include all pages', 400)
        }
        
        // Create new PDF with rearranged pages
        const newPdf = await PDFDocument.create()
        const copiedPages = await newPdf.copyPages(pdf, orderArray)
        copiedPages.forEach(copiedPage => newPdf.addPage(copiedPage))
        
        const rearrangedBytes = await newPdf.save()
        const filename = `edited_${Date.now()}.pdf`
        const filePath = getTempFilePath(filename)
        await writeFile(filePath, rearrangedBytes)
        
        setTimeout(() => cleanupFile(filename), 60 * 60 * 1000)
        
        return new NextResponse(new Uint8Array(rearrangedBytes), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': rearrangedBytes.length.toString(),
          },
        })

      default:
        return createErrorResponse('Invalid action specified', 400)
    }

    // Save the modified PDF
    const pdfBytes = await pdf.save()
    const filename = `edited_${Date.now()}.pdf`
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
    console.error('Error editing PDF:', error)
    return createErrorResponse('Failed to edit PDF', 500)
  }
}
