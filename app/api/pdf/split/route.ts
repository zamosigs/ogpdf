import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const pageRanges = formData.get('pageRanges') as string
    
    if (!file || file.type !== 'application/pdf') {
      return createErrorResponse('Valid PDF file is required', 400)
    }

    if (!pageRanges) {
      return createErrorResponse('Page ranges are required', 400)
    }

    // Parse page ranges (e.g., "1-3,5,7-9")
    const ranges = pageRanges.split(',').map(range => {
      const [start, end] = range.split('-').map(num => parseInt(num.trim()))
      return { start: start - 1, end: end ? end - 1 : start - 1 } // Convert to 0-based indexing
    })

    const arrayBuffer = await file.arrayBuffer()
    const originalPdf = await PDFDocument.load(arrayBuffer)
    const totalPages = originalPdf.getPageCount()

    // Validate page ranges
    for (const range of ranges) {
      if (range.start < 0 || range.end >= totalPages || range.start > range.end) {
        return createErrorResponse(`Invalid page range: ${range.start + 1}-${range.end + 1}`, 400)
      }
    }

    const zip = new JSZip()
    let splitIndex = 1

    // Create separate PDFs for each range
    for (const range of ranges) {
      const splitPdf = await PDFDocument.create()
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i)
      const copiedPages = await splitPdf.copyPages(originalPdf, pageIndices)
      
      copiedPages.forEach((page) => {
        splitPdf.addPage(page)
      })

      const pdfBytes = await splitPdf.save()
      const filename = `split_${splitIndex}_pages_${range.start + 1}-${range.end + 1}.pdf`
      zip.file(filename, pdfBytes)
      splitIndex++
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipFilename = `split_pdf_${Date.now()}.zip`
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
    console.error('Error splitting PDF:', error)
    return createErrorResponse('Failed to split PDF', 500)
  }
}
