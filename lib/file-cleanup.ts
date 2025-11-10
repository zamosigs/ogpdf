import fs from 'fs'
import path from 'path'
import os from 'os'

// Use /tmp for serverless environments (Vercel, AWS Lambda, etc.)
const TEMP_DIR = process.env.VERCEL 
  ? '/tmp' 
  : path.join(process.cwd(), 'temp')
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export function scheduleFileCleanup() {
  setInterval(() => {
    cleanupOldFiles()
  }, CLEANUP_INTERVAL)
}

export function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR)
    const now = Date.now()
    
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file)
      const stats = fs.statSync(filePath)
      const fileAge = now - stats.mtime.getTime()
      
      // Delete files older than 1 hour
      if (fileAge > CLEANUP_INTERVAL) {
        fs.unlinkSync(filePath)
        console.log(`Cleaned up old file: ${file}`)
      }
    })
  } catch (error) {
    console.error('Error during file cleanup:', error)
  }
}

export function getTempFilePath(filename: string): string {
  return path.join(TEMP_DIR, filename)
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

export function cleanupFile(filename: string): void {
  const filePath = getTempFilePath(filename)
  deleteFile(filePath)
}

// Start cleanup process
scheduleFileCleanup()
