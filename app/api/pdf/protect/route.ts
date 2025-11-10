import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const password = formData.get('password') as string
    const action = formData.get('action') as string // 'protect' or 'unprotect'

    if (!file || file.type !== 'application/pdf') {
      return createErrorResponse('Valid PDF file is required', 400)
    }

    if (!password) {
      return createErrorResponse('Password is required', 400)
    }

    if (!action || !['protect', 'unprotect'].includes(action)) {
      return createErrorResponse('Action must be "protect" or "unprotect"', 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    if (action === 'protect') {
      // Add password protection
      pdf.setTitle(file.name.replace('.pdf', '') + ' (Protected)')
      // Note: pdf-lib doesn't support password protection directly
      // This would require additional libraries like pdf2pic or similar
      return createErrorResponse('Password protection requires additional setup', 501)
    } else {
      // Remove password protection
      // This would also require additional libraries
      return createErrorResponse('Password removal requires additional setup', 501)
    }

    // Save the modified PDF
    const pdfBytes = await pdf.save()
    const filename = `${action}_${Date.now()}.pdf`
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
    console.error('Error processing PDF protection:', error)
    return createErrorResponse('Failed to process PDF protection', 500)
  }
}
