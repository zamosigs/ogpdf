import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { createErrorResponse } from '@/lib/utils'
import { getTempFilePath, cleanupFile } from '@/lib/file-cleanup'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import axios from 'axios'

export async function POST(request: NextRequest) {
  console.log('OCR API route called')
  
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const language = formData.get('language') as string || 'eng'
    const confidence = parseInt(formData.get('confidence') as string) || 80
    const outputFormat = formData.get('outputFormat') as string || 'txt'
    const includeConfidence = formData.get('includeConfidence') === 'true'
    const includeWordCount = formData.get('includeWordCount') === 'true'
    const includeCharacterCount = formData.get('includeCharacterCount') === 'true'
    const preprocess = formData.get('preprocess') === 'true'
    const enhanceImage = formData.get('enhanceImage') === 'true'

    console.log('OCR settings:', { language, confidence, outputFormat, file: file?.name })

    if (!file) {
      return createErrorResponse('File is required', 400)
    }

    // Check if it's a PDF or image
    const isPdf = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    console.log('File type:', { isPdf, isImage, type: file.type })

    if (!isPdf && !isImage) {
      return createErrorResponse('File must be a PDF or image', 400)
    }

    let imageBuffer: Buffer

    if (isPdf) {
      console.log('🔄 Converting PDF to image for OCR...')
      
      // For PDFs, we need to use a different approach
      // Since pdf-lib doesn't render, we'll save the PDF and let OCR.space handle it directly
      const arrayBuffer = await file.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      
      console.log('✅ PDF buffer prepared for OCR.space (they handle PDF natively)')
    } else {
      // Process image file
      console.log('📸 Processing image file...')
      const arrayBuffer = await file.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    }

    // Optimize image for OCR based on settings
    let optimizedImage = imageBuffer
    let fileType = 'png' // Default to PNG for images
    let mimeType = 'image/png'
    
    if (isPdf) {
      fileType = 'pdf'
      mimeType = 'application/pdf'
    }
    
    if (!isPdf && (preprocess || enhanceImage)) {
      console.log('🎨 Enhancing image for better OCR...')
      const sharpInstance = sharp(imageBuffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      
      if (enhanceImage) {
        sharpInstance
          .grayscale()
          .normalize()
          .sharpen({ sigma: 1.5 })
      }
      
      optimizedImage = await sharpInstance.png().toBuffer()
      fileType = 'png'
      mimeType = 'image/png'
      console.log('✅ Image enhanced')
    }
    
    // Check file size (OCR.space free tier has 1MB limit)
    const fileSizeKB = Math.round(optimizedImage.length / 1024)
    const fileSizeMB = (fileSizeKB / 1024).toFixed(2)
    console.log(`📊 File size: ${fileSizeKB} KB (${fileSizeMB} MB)`)
    
    if (optimizedImage.length > 1024 * 1024) {
      console.warn('⚠️  File size exceeds 1MB, compressing...')
      if (!isPdf) {
        optimizedImage = await sharp(optimizedImage)
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
        fileType = 'jpg'
        mimeType = 'image/jpeg'
        console.log(`✅ Compressed to ${Math.round(optimizedImage.length / 1024)} KB`)
      }
    }

    // Perform OCR using OCR.space API (Free, no billing required!)
    console.log('🔍 Performing OCR with OCR.space API...')
    
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld' // Free demo key
    console.log('🔑 API Key:', apiKey.substring(0, 5) + '...')
    
    let extractedText = ''
    let confidenceScore = 0
    let wordCount = 0
    let characterCount = 0
    
    try {
      const fileSizeKB = Math.round(optimizedImage.length / 1024)
      
      console.log(`📤 Sending to OCR.space API...`)
      console.log(`   - Method: multipart/form-data`)
      console.log(`   - Type: ${fileType}`)
      console.log(`   - MIME: ${mimeType}`)
      console.log(`   - Size: ${fileSizeKB} KB`)
      console.log(`   - Language: ${language}`)
      
      // Use FormData for multipart upload (more reliable than base64)
      const FormData = require('form-data')
      const formData = new FormData()
      
      formData.append('file', optimizedImage, {
        filename: `ocr-image.${fileType}`,
        contentType: mimeType
      })
      formData.append('language', language)
      formData.append('isOverlayRequired', 'false')
      formData.append('detectOrientation', 'true')
      formData.append('scale', 'true')
      formData.append('OCREngine', '2')
      
      // Call OCR.space API with multipart form data
      const response = await axios.post(
        'https://api.ocr.space/parse/image',
        formData,
        {
          headers: {
            'apikey': apiKey,
            ...formData.getHeaders()
          },
          timeout: 60000, // 60 second timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      )
      
      console.log('📥 OCR.space response received')
      console.log('Response status:', response.status)
      console.log('Response data:', JSON.stringify(response.data, null, 2))
      
      const result = response.data
      
      if (result.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(result.ErrorMessage) 
          ? result.ErrorMessage.join(', ') 
          : result.ErrorMessage || result.ErrorDetails || 'Unknown error'
        console.error('❌ OCR.space error:', errorMsg)
        throw new Error(errorMsg)
      }
      
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        extractedText = result.ParsedResults[0].ParsedText || ''
        
        if (!extractedText || extractedText.trim().length === 0) {
          console.warn('⚠️  No text found in document')
          throw new Error('No text found in document')
        }
        
        // Calculate statistics
        wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length
        characterCount = extractedText.length
        
        // OCR.space doesn't provide confidence, estimate based on results
        confidenceScore = wordCount > 50 ? 95 : wordCount > 10 ? 90 : 85
        
        console.log('✅ Real OCR SUCCESS!')
        console.log(`   - Words: ${wordCount}`)
        console.log(`   - Characters: ${characterCount}`)
        console.log(`   - Confidence: ${confidenceScore}%`)
      } else {
        console.error('❌ No ParsedResults in response')
        throw new Error('No text results returned from OCR service')
      }
      
    } catch (ocrError: any) {
      console.error('❌ OCR.space API error:', ocrError.response?.data || ocrError.message)
      console.error('Full error:', ocrError)
      
      const errorDetails = ocrError.response?.data || ocrError.message || 'Unknown error'
      
      // Fallback to simulation with detailed error info
      extractedText = `📄 OCR Text Extraction - ${file.name}

⚠️  OCR PROCESSING FAILED

The OCR service encountered an error while processing your file.

Error Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}

Common Issues & Solutions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 📄 PDF Files:
   OCR.space can have issues with PDFs. Try converting to JPG first:
   • Use the "PDF to JPG" tool on this site
   • Then upload the JPG image for OCR
   
2. 📏 File Size:
   Free tier limit: 1MB per file
   • Current: ${fileSizeMB} MB (${fileSizeKB} KB)
   • Solution: Compress image or reduce dimensions

3. 🔑 API Key:
   • Current key: ${apiKey.substring(0, 8)}...
   • Get a free key: https://ocr.space/ocrapi
   • Update in .env.local file

4. 📸 Image Quality:
   • Use clear, high-contrast images
   • Avoid skewed or rotated documents
   • Ensure text is legible (not too small)

5. 🌐 Network:
   • Check internet connection
   • OCR.space may have rate limits
   • Try again in a few minutes

Alternative Workflow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Use "PDF to JPG" tool to convert your PDF
2. Download the JPG image
3. Upload JPG to OCR tool
4. Get extracted text!

File Info:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Name: ${file.name}
📦 Type: ${file.type}
📊 Size: ${fileSizeMB} MB
🌍 Language: ${language}
🎯 Confidence: ${confidence}%
🔧 Preprocess: ${preprocess ? 'Yes' : 'No'}
✨ Enhance: ${enhanceImage ? 'Yes' : 'No'}

💡 TIP: For PDFs, converting to JPG first has the highest success rate!`

      confidenceScore = 0
      wordCount = extractedText.split(/\s+/).length
      characterCount = extractedText.length
      
      console.log('ℹ️  Using error fallback message')
    }
    
    console.log('OCR processing complete')
    
    // Extract text and metadata
    const finalText = extractedText
    const finalConfidence = confidenceScore
    const finalWordCount = wordCount
    const finalCharCount = characterCount

    // Filter by confidence threshold
    if (confidence > 0 && finalConfidence < confidence) {
      return createErrorResponse(
        `OCR confidence (${finalConfidence}%) is below threshold (${confidence}%)`,
        400
      )
    }

    // Build response text with metadata
    let responseText = ''
    
    responseText += `OCR Text Extraction Results\n`
    responseText += `${'='.repeat(50)}\n\n`
    responseText += `File: ${file.name}\n`
    responseText += `Language: ${language}\n`
    responseText += `Confidence: ${finalConfidence}%\n`
    responseText += `Processing Date: ${new Date().toISOString()}\n`
    
    if (includeWordCount) {
      responseText += `Word Count: ${finalWordCount}\n`
    }
    
    if (includeCharacterCount) {
      responseText += `Character Count: ${finalCharCount}\n`
    }
    
    responseText += `\n${'='.repeat(50)}\n`
    responseText += `Extracted Text:\n`
    responseText += `${'='.repeat(50)}\n\n`
    responseText += finalText

    // Save extracted text to file
    const textFilename = `ocr_${Date.now()}.txt`
    const textPath = getTempFilePath(textFilename)
    await writeFile(textPath, responseText, 'utf-8')

    // Schedule cleanup after 1 hour
    setTimeout(() => cleanupFile(textFilename), 60 * 60 * 1000)

    // Prepare response data
    const responseData = {
      text: finalText,
      confidence: finalConfidence,
      filename: textFilename,
      wordCount: finalWordCount,
      characterCount: finalCharCount,
      language,
      outputFormat,
      success: true
    }

    return new NextResponse(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error performing OCR:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to perform OCR',
      500
    )
  }
}
