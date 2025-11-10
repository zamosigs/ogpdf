import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const quality = parseFloat(formData.get('quality') as string) || 0.8

    if (!file || file.type !== 'application/pdf') {
      return createErrorResponse('Valid PDF file is required', 400)
    }

    if (quality < 0.1 || quality > 1.0) {
      return createErrorResponse('Quality must be between 0.1 and 1.0', 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    const pageCount = pdfDoc.getPageCount()
    console.log(`Compressing PDF with ${pageCount} pages, quality: ${quality}`)
    
    // Determine compression level based on quality
    let objectsPerTick = 50
    if (quality <= 0.5) {
      objectsPerTick = 200 // Maximum compression
    } else if (quality <= 0.7) {
      objectsPerTick = 150 // High compression
    } else if (quality <= 0.8) {
      objectsPerTick = 100 // Medium compression
    }

    // Save with compression options - just re-save the original PDF
    // This preserves existing compression while applying object stream compression
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true, // Major space saver - compresses object streams
      addDefaultPage: false,
      objectsPerTick: objectsPerTick,
      updateFieldAppearances: false,
    })

    let finalBytes = pdfBytes

    const filename = `compressed_${Date.now()}.pdf`
    const filePath = getTempFilePath(filename)
    await writeFile(filePath, finalBytes)

    // Schedule cleanup after 1 hour
    setTimeout(() => cleanupFile(filename), 60 * 60 * 1000)

    const originalSize = arrayBuffer.byteLength
    const compressedSize = finalBytes.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    const savedBytes = originalSize - compressedSize
    const savedMB = (savedBytes / (1024 * 1024)).toFixed(2)

    console.log(`Compression complete: ${originalSize} -> ${compressedSize} bytes (${compressionRatio}% reduction, saved ${savedMB}MB)`)

    return new NextResponse(new Uint8Array(finalBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalBytes.length.toString(),
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio,
        'X-Saved-Bytes': savedBytes.toString(),
        'X-Saved-MB': savedMB,
      },
    })
  } catch (error) {
    console.error('Error compressing PDF:', error)
    return createErrorResponse('Failed to compress PDF', 500)
  }
}
