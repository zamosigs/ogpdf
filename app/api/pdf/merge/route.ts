import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length < 2) {
      return createErrorResponse('At least 2 PDF files are required for merging', 400)
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return createErrorResponse('All files must be PDF format', 400)
      }
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()
    
    // Process each PDF file
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      // Copy all pages from the current PDF to the merged PDF
      const pageIndices = pdf.getPageIndices()
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }

    // Generate the merged PDF
    const pdfBytes = await mergedPdf.save()
    
    // Save to temporary file
    const filename = `merged_${Date.now()}.pdf`
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
    console.error('Error merging PDFs:', error)
    return createErrorResponse('Failed to merge PDFs', 500)
  }
}
