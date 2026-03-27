// Type definitions for the ShareFiles app

export interface UploadResponse {
  code: string
  expiresAt: string
  expiresIn: number
  fileSize: number
  filename: string
  fileCount: number
}

export interface UploadInitiateResponse {
  code: string
  uploadUrl: string
  fileKey: string
  filename: string
  mimeType: string
  fileCount: number
  maxUploadSizeBytes: number
}

export interface DownloadResponse {
  downloadUrl: string
  filename: string
  fileSize: number
  expiresAt: string
  expiresIn: number
}

export interface UploadError {
  code: 'NO_FILE' | 'INVALID_EXPIRY' | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'UPLOAD_FAILED' | 'CODE_GENERATION_FAILED' | 'DB_ERROR' | 'UNKNOWN'
  message: string
}

export interface DownloadError {
  code: 'INVALID_CODE' | 'EXPIRED' | 'NOT_FOUND' | 'UNKNOWN'
  message: string
}

export type ExpiryMinutes = 15 | 60 | 1440 | 10080
