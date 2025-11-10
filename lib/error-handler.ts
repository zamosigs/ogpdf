export interface ErrorInfo {
  code: string
  message: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

export const ERROR_CODES = {
  // File related errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  
  // PDF processing errors
  PDF_PASSWORD_PROTECTED: 'PDF_PASSWORD_PROTECTED',
  PDF_CORRUPTED: 'PDF_CORRUPTED',
  PDF_EMPTY: 'PDF_EMPTY',
  PDF_PAGE_RANGE_INVALID: 'PDF_PAGE_RANGE_INVALID',
  
  // OCR errors
  OCR_LANGUAGE_NOT_SUPPORTED: 'OCR_LANGUAGE_NOT_SUPPORTED',
  OCR_NO_TEXT_FOUND: 'OCR_NO_TEXT_FOUND',
  OCR_IMAGE_TOO_SMALL: 'OCR_IMAGE_TOO_SMALL',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  
  // Validation errors
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
} as const

export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  [ERROR_CODES.FILE_TOO_LARGE]: {
    code: ERROR_CODES.FILE_TOO_LARGE,
    message: 'File size exceeds the maximum limit',
    suggestion: 'Please compress your file or split it into smaller parts',
    severity: 'medium'
  },
  
  [ERROR_CODES.INVALID_FILE_TYPE]: {
    code: ERROR_CODES.INVALID_FILE_TYPE,
    message: 'Unsupported file format',
    suggestion: 'Please upload a PDF or image file (JPG, PNG, GIF, WebP)',
    severity: 'low'
  },
  
  [ERROR_CODES.FILE_CORRUPTED]: {
    code: ERROR_CODES.FILE_CORRUPTED,
    message: 'The file appears to be corrupted',
    suggestion: 'Please try uploading a different file or re-save the original',
    severity: 'high'
  },
  
  [ERROR_CODES.PDF_PASSWORD_PROTECTED]: {
    code: ERROR_CODES.PDF_PASSWORD_PROTECTED,
    message: 'PDF is password protected',
    suggestion: 'Please remove the password protection before processing',
    severity: 'medium'
  },
  
  [ERROR_CODES.PDF_CORRUPTED]: {
    code: ERROR_CODES.PDF_CORRUPTED,
    message: 'PDF file is corrupted or damaged',
    suggestion: 'Please try with a different PDF file or repair the original',
    severity: 'high'
  },
  
  [ERROR_CODES.PDF_EMPTY]: {
    code: ERROR_CODES.PDF_EMPTY,
    message: 'PDF file is empty',
    suggestion: 'Please upload a PDF file with content',
    severity: 'low'
  },
  
  [ERROR_CODES.PDF_PAGE_RANGE_INVALID]: {
    code: ERROR_CODES.PDF_PAGE_RANGE_INVALID,
    message: 'Invalid page range specified',
    suggestion: 'Please check the page numbers and try again (e.g., "1-3,5,7-9")',
    severity: 'low'
  },
  
  [ERROR_CODES.OCR_LANGUAGE_NOT_SUPPORTED]: {
    code: ERROR_CODES.OCR_LANGUAGE_NOT_SUPPORTED,
    message: 'Language not supported for OCR',
    suggestion: 'Please try with a supported language code (eng, spa, fra, deu, etc.)',
    severity: 'low'
  },
  
  [ERROR_CODES.OCR_NO_TEXT_FOUND]: {
    code: ERROR_CODES.OCR_NO_TEXT_FOUND,
    message: 'No text could be extracted from the image',
    suggestion: 'Try with a clearer image or different language setting',
    severity: 'medium'
  },
  
  [ERROR_CODES.OCR_IMAGE_TOO_SMALL]: {
    code: ERROR_CODES.OCR_IMAGE_TOO_SMALL,
    message: 'Image is too small for OCR processing',
    suggestion: 'Please upload a higher resolution image',
    severity: 'low'
  },
  
  [ERROR_CODES.NETWORK_ERROR]: {
    code: ERROR_CODES.NETWORK_ERROR,
    message: 'Network connection failed',
    suggestion: 'Please check your internet connection and try again',
    severity: 'medium'
  },
  
  [ERROR_CODES.TIMEOUT_ERROR]: {
    code: ERROR_CODES.TIMEOUT_ERROR,
    message: 'Processing timed out',
    suggestion: 'Try with a smaller file or try again later',
    severity: 'medium'
  },
  
  [ERROR_CODES.SERVER_ERROR]: {
    code: ERROR_CODES.SERVER_ERROR,
    message: 'Server error occurred',
    suggestion: 'Please try again in a few moments',
    severity: 'high'
  },
  
  [ERROR_CODES.PROCESSING_ERROR]: {
    code: ERROR_CODES.PROCESSING_ERROR,
    message: 'Failed to process the file',
    suggestion: 'Please try with a different file or contact support',
    severity: 'high'
  },
  
  [ERROR_CODES.MEMORY_ERROR]: {
    code: ERROR_CODES.MEMORY_ERROR,
    message: 'Insufficient memory to process file',
    suggestion: 'Try with a smaller file or split it into parts',
    severity: 'high'
  },
  
  [ERROR_CODES.INVALID_PARAMETERS]: {
    code: ERROR_CODES.INVALID_PARAMETERS,
    message: 'Invalid parameters provided',
    suggestion: 'Please check your input and try again',
    severity: 'low'
  },
  
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: {
    code: ERROR_CODES.MISSING_REQUIRED_FIELD,
    message: 'Required field is missing',
    suggestion: 'Please provide all required information',
    severity: 'low'
  }
}

export function getErrorInfo(error: Error | string): ErrorInfo {
  const errorMessage = typeof error === 'string' ? error : error.message
  
  // Try to match known error patterns
  if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
    return ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE]
  }
  
  if (errorMessage.includes('invalid file') || errorMessage.includes('unsupported')) {
    return ERROR_MESSAGES[ERROR_CODES.INVALID_FILE_TYPE]
  }
  
  if (errorMessage.includes('corrupted') || errorMessage.includes('damaged')) {
    return ERROR_MESSAGES[ERROR_CODES.FILE_CORRUPTED]
  }
  
  if (errorMessage.includes('password') || errorMessage.includes('protected')) {
    return ERROR_MESSAGES[ERROR_CODES.PDF_PASSWORD_PROTECTED]
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR]
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
  }
  
  if (errorMessage.includes('memory') || errorMessage.includes('insufficient')) {
    return ERROR_MESSAGES[ERROR_CODES.MEMORY_ERROR]
  }
  
  // Default to server error
  return ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR]
}

export function formatErrorForUser(error: Error | string): string {
  const errorInfo = getErrorInfo(error)
  return `${errorInfo.message}. ${errorInfo.suggestion}`
}

export function getErrorSeverity(error: Error | string): 'low' | 'medium' | 'high' {
  const errorInfo = getErrorInfo(error)
  return errorInfo.severity
}
