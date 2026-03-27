import { NextRequest, NextResponse } from 'next/server'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME, R2_ACCOUNT_ID } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'
import { MAX_FILE_SIZE, MAX_TOTAL_UPLOAD_SIZE } from '@/app/lib/constants'
import { UploadError, UploadResponse } from '@/app/lib/types'

interface UploadCompleteRequest {
  code?: string
  fileKey?: string
  filename?: string
  mimeType?: string
  fileSize?: number
  fileCount?: number
  expiryMinutes?: number
}

function isValidExpiryMinutes(expiryMinutes: number) {
  return [15, 60, 1440, 10080].includes(expiryMinutes)
}

function isValidCode(code: string) {
  return /^[A-Z0-9]{6}$/.test(code)
}

export async function POST(request: NextRequest) {
  try {
    let body: UploadCompleteRequest
    try {
      body = (await request.json()) as UploadCompleteRequest
    } catch {
      return NextResponse.json(
        { code: 'UNKNOWN', message: 'Invalid JSON payload' } as UploadError,
        { status: 400 }
      )
    }

    const code = (body.code || '').toUpperCase()
    const fileKey = body.fileKey || ''
    const filename = body.filename || ''
    const mimeType = body.mimeType || 'application/octet-stream'
    const fileCount = Number(body.fileCount)
    const expiryMinutes = Number(body.expiryMinutes)

    if (!isValidCode(code)) {
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Invalid upload code' } as UploadError,
        { status: 400 }
      )
    }

    if (!fileKey || !fileKey.startsWith(`${code}/`) || !filename) {
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Invalid upload metadata' } as UploadError,
        { status: 400 }
      )
    }

    if (!Number.isFinite(fileCount) || fileCount < 1) {
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Invalid file count' } as UploadError,
        { status: 400 }
      )
    }

    if (!isValidExpiryMinutes(expiryMinutes)) {
      return NextResponse.json(
        { code: 'INVALID_EXPIRY', message: 'Invalid expiry minutes' } as UploadError,
        { status: 400 }
      )
    }

    let actualFileSize = Number(body.fileSize)

    try {
      const headResponse = await r2Client.send(
        new HeadObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
        })
      )

      if (typeof headResponse.ContentLength === 'number' && headResponse.ContentLength > 0) {
        actualFileSize = headResponse.ContentLength
      }
    } catch (error) {
      console.error('R2 head object error:', error)
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Uploaded file not found in storage' } as UploadError,
        { status: 404 }
      )
    }

    if (!Number.isFinite(actualFileSize) || actualFileSize <= 0) {
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Invalid uploaded file size' } as UploadError,
        { status: 400 }
      )
    }

    if (actualFileSize > MAX_FILE_SIZE || actualFileSize > MAX_TOTAL_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          code: 'FILE_TOO_LARGE',
          message: `Uploaded file exceeds ${Math.floor(MAX_TOTAL_UPLOAD_SIZE / 1024 / 1024)}MB limit`,
        } as UploadError,
        { status: 413 }
      )
    }

    const fileUrl = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileKey}`
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    const { error: dbError } = await supabaseAdmin!.from('files').insert({
      code,
      file_url: fileUrl,
      filename,
      file_size: actualFileSize,
      mime_type: mimeType,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      downloaded_count: 0,
    })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { code: 'DB_ERROR', message: 'Failed to save file metadata' } as UploadError,
        { status: 500 }
      )
    }

    const response: UploadResponse = {
      code,
      expiresAt: expiresAt.toISOString(),
      expiresIn: expiryMinutes,
      fileSize: actualFileSize,
      filename,
      fileCount,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Upload complete error:', error)
    return NextResponse.json(
      { code: 'UNKNOWN', message: 'An unexpected error occurred' } as UploadError,
      { status: 500 }
    )
  }
}
