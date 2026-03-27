import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET_NAME } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'
import { generateCode } from '@/app/lib/codeGenerator'
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_TOTAL_UPLOAD_SIZE,
} from '@/app/lib/constants'
import { UploadError, UploadInitiateResponse } from '@/app/lib/types'

interface IncomingUploadFile {
  name: string
  size: number
  type?: string
  path?: string
}

interface UploadInitiateRequest {
  files?: IncomingUploadFile[]
  expiryMinutes?: number
}

function normalizeMimeType(mimeType: string) {
  return mimeType.split(';')[0].trim().toLowerCase()
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return ''
  }
  return filename.slice(dotIndex + 1).toLowerCase()
}

function getBaseName(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '')
  const parts = normalized.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : normalized
}

function isIgnorableUploadFile(file: IncomingUploadFile) {
  const basename = getBaseName(file.path || file.name).toLowerCase()
  return (
    basename === '.ds_store' ||
    basename === 'thumbs.db' ||
    basename === 'desktop.ini' ||
    basename.startsWith('._')
  )
}

function isFileTypeAllowed(file: IncomingUploadFile) {
  const mimeType = normalizeMimeType(file.type || '')
  if (mimeType && ALLOWED_FILE_TYPES.includes(mimeType as (typeof ALLOWED_FILE_TYPES)[number])) {
    return true
  }

  const extension = getFileExtension(file.name)
  return ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number])
}

function isValidExpiryMinutes(expiryMinutes: number) {
  return [15, 60, 1440, 10080].includes(expiryMinutes)
}

async function generateUniqueCode() {
  let code = generateCode()
  let codeExists = true
  let attempts = 0

  while (codeExists && attempts < 10) {
    const { data } = await supabaseAdmin!.from('files').select('code').eq('code', code).single()
    codeExists = !!data
    if (codeExists) code = generateCode()
    attempts++
  }

  return { code, codeExists }
}

export async function POST(request: NextRequest) {
  try {
    let body: UploadInitiateRequest
    try {
      body = (await request.json()) as UploadInitiateRequest
    } catch {
      return NextResponse.json(
        { code: 'UNKNOWN', message: 'Invalid JSON payload' } as UploadError,
        { status: 400 }
      )
    }

    const files = Array.isArray(body.files) ? body.files : []
    const expiryMinutes = Number(body.expiryMinutes)

    if (!files.length) {
      return NextResponse.json(
        { code: 'NO_FILE', message: 'No valid files provided' } as UploadError,
        { status: 400 }
      )
    }

    if (!isValidExpiryMinutes(expiryMinutes)) {
      return NextResponse.json(
        { code: 'INVALID_EXPIRY', message: 'Invalid expiry minutes' } as UploadError,
        { status: 400 }
      )
    }

    const validFiles = files.filter((file) => !isIgnorableUploadFile(file))
    if (!validFiles.length) {
      return NextResponse.json(
        { code: 'NO_FILE', message: 'No valid files provided' } as UploadError,
        { status: 400 }
      )
    }

    let totalUploadSize = 0
    for (const file of validFiles) {
      if (!file.name || typeof file.size !== 'number' || file.size <= 0) {
        return NextResponse.json(
          { code: 'NO_FILE', message: 'Invalid file payload' } as UploadError,
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            code: 'FILE_TOO_LARGE',
            message: `${file.name} exceeds ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB limit`,
          } as UploadError,
          { status: 413 }
        )
      }

      if (!isFileTypeAllowed(file)) {
        return NextResponse.json(
          { code: 'INVALID_FILE_TYPE', message: `File type not allowed: ${file.name}` } as UploadError,
          { status: 400 }
        )
      }

      totalUploadSize += file.size
    }

    if (totalUploadSize > MAX_TOTAL_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          code: 'FILE_TOO_LARGE',
          message: `Total upload size exceeds ${Math.floor(MAX_TOTAL_UPLOAD_SIZE / 1024 / 1024)}MB limit`,
        } as UploadError,
        { status: 413 }
      )
    }

    const { code, codeExists } = await generateUniqueCode()
    if (codeExists) {
      return NextResponse.json(
        { code: 'CODE_GENERATION_FAILED', message: 'Failed to generate unique code' } as UploadError,
        { status: 500 }
      )
    }

    const isBulkUpload = validFiles.length > 1
    const filename = isBulkUpload ? `sharefiles-${code}.zip` : validFiles[0].name
    const mimeType = isBulkUpload
      ? 'application/zip'
      : validFiles[0].type || 'application/octet-stream'

    const fileKey = `${code}/${filename}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
      Metadata: {
        'original-filename': filename,
        'file-count': String(validFiles.length),
        'upload-time': new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 15 })

    const response: UploadInitiateResponse = {
      code,
      uploadUrl,
      fileKey,
      filename,
      mimeType,
      fileCount: validFiles.length,
      maxUploadSizeBytes: MAX_TOTAL_UPLOAD_SIZE,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Upload initiate error:', error)
    return NextResponse.json(
      { code: 'UNKNOWN', message: 'An unexpected error occurred' } as UploadError,
      { status: 500 }
    )
  }
}
