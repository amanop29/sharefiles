import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import JSZip from 'jszip'
import { r2Client, R2_BUCKET_NAME, R2_ACCOUNT_ID } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'
import { generateCode } from '@/app/lib/codeGenerator'
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/app/lib/constants'
import { UploadResponse, UploadError } from '@/app/lib/types'

function sanitizeZipPath(path: string) {
  const normalized = path.replace(/\\/g, '/').trim()
  const segments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')

  return segments.join('/')
}

function addNumberSuffix(filePath: string, suffixNumber: number) {
  const normalized = filePath.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  const dirname = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : ''
  const basename = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized

  const dotIndex = basename.lastIndexOf('.')
  const hasExtension = dotIndex > 0
  const name = hasExtension ? basename.slice(0, dotIndex) : basename
  const extension = hasExtension ? basename.slice(dotIndex) : ''

  return `${dirname}${name} (${suffixNumber})${extension}`
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return ''
  }
  return filename.slice(dotIndex + 1).toLowerCase()
}

function isFileTypeAllowed(file: File) {
  if (ALLOWED_FILE_TYPES.includes(file.type)) {
    return true
  }

  const extension = getFileExtension(file.name)
  return ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number])
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const filesFromForm = formData.getAll('files').filter((entry): entry is File => entry instanceof File)
    const pathsFromForm = formData
      .getAll('paths')
      .map((entry) => (typeof entry === 'string' ? entry : ''))
    const legacyFile = formData.get('file') as File | null
    const files = filesFromForm.length > 0 ? filesFromForm : legacyFile ? [legacyFile] : []
    const expiryMinutes = formData.get('expiryMinutes') as string | null

    // Validation
    if (files.length === 0) {
      return NextResponse.json(
        { code: 'NO_FILE', message: 'No files provided' } as UploadError,
        { status: 400 }
      )
    }

    if (!expiryMinutes || !['15', '60', '1440', '10080'].includes(expiryMinutes)) {
      return NextResponse.json(
        { code: 'INVALID_EXPIRY', message: 'Invalid expiry minutes' } as UploadError,
        { status: 400 }
      )
    }

    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalUploadSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          code: 'FILE_TOO_LARGE',
          message: `Total upload size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        } as UploadError,
        { status: 413 }
      )
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            code: 'FILE_TOO_LARGE',
            message: `${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
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
    }

    // Generate unique code
    let code = generateCode()
    let codeExists = true
    let attempts = 0
    while (codeExists && attempts < 10) {
      const { data } = await supabaseAdmin!.from('files').select('code').eq('code', code).single()
      codeExists = !!data
      if (codeExists) code = generateCode()
      attempts++
    }

    if (codeExists) {
      return NextResponse.json(
        { code: 'CODE_GENERATION_FAILED', message: 'Failed to generate unique code' } as UploadError,
        { status: 500 }
      )
    }

    const isBulkUpload = files.length > 1
    let body: Uint8Array
    let storedFilename: string
    let storedMimeType: string
    let storedFileSize: number

    if (isBulkUpload) {
      const zip = new JSZip()
      const filenameCounter = new Map<string, number>()

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const fileBuffer = await file.arrayBuffer()

        const rawPath = pathsFromForm[index] || file.name
        const safePath = sanitizeZipPath(rawPath) || file.name
        const currentCount = filenameCounter.get(safePath) ?? 0
        filenameCounter.set(safePath, currentCount + 1)

        const zipEntryPath = currentCount === 0 ? safePath : addNumberSuffix(safePath, currentCount + 1)
        zip.file(zipEntryPath, fileBuffer)
      }

      body = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
      storedFilename = `sharefiles-${code}.zip`
      storedMimeType = 'application/zip'
      storedFileSize = body.byteLength
    } else {
      const singleFile = files[0]
      const fileBuffer = await singleFile.arrayBuffer()
      body = new Uint8Array(fileBuffer)
      storedFilename = singleFile.name
      storedMimeType = singleFile.type || 'application/octet-stream'
      storedFileSize = singleFile.size
    }

    const fileKey = `${code}/${storedFilename}`

    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: body,
          ContentType: storedMimeType,
          Metadata: {
            'original-filename': storedFilename,
            'file-count': String(files.length),
            'upload-time': new Date().toISOString(),
          },
        })
      )
    } catch (error) {
      console.error('R2 upload error:', error)
      return NextResponse.json(
        { code: 'UPLOAD_FAILED', message: 'Failed to upload file to storage' } as UploadError,
        { status: 500 }
      )
    }

    // Generate file URL
    const fileUrl = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileKey}`

    // Calculate expiry time
    const expiryMs = parseInt(expiryMinutes) * 60 * 1000
    const expiresAt = new Date(Date.now() + expiryMs)

    // Save metadata to Supabase
    const { error: dbError } = await supabaseAdmin!.from('files').insert({
      code,
      file_url: fileUrl,
      filename: storedFilename,
      file_size: storedFileSize,
      mime_type: storedMimeType,
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

    // Return success response
    const response: UploadResponse = {
      code,
      expiresAt: expiresAt.toISOString(),
      expiresIn: parseInt(expiryMinutes),
      fileSize: storedFileSize,
      filename: storedFilename,
      fileCount: files.length,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { code: 'UNKNOWN', message: 'An unexpected error occurred' } as UploadError,
      { status: 500 }
    )
  }
}
