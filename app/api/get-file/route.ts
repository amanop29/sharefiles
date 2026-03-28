import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'
import { DownloadResponse, DownloadError } from '@/app/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const shouldDownload = searchParams.get('download') === '1'

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { code: 'INVALID_CODE', message: 'Code parameter is required' } as DownloadError,
        { status: 400 }
      )
    }

    // Query file metadata from Supabase
    const { data, error } = await supabaseAdmin!
      .from('files')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { code: 'INVALID_CODE', message: 'File not found' } as DownloadError,
        { status: 404 }
      )
    }

    // Check if file has expired
    const expiresAt = new Date(data.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      return NextResponse.json(
        { code: 'EXPIRED', message: 'File has expired' } as DownloadError,
        { status: 410 }
      )
    }

    if (shouldDownload) {
      let fileKey = ''

      try {
        const parsedUrl = new URL(data.file_url)
        fileKey = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''))
      } catch {
        // Fallback for malformed or legacy values.
        fileKey = `${code.toUpperCase()}/${data.filename}`
      }

      if (!fileKey) {
        return NextResponse.json(
          { code: 'NOT_FOUND', message: 'Invalid file path' } as DownloadError,
          { status: 404 }
        )
      }

      let objectResponse
      try {
        objectResponse = await r2Client.send(
          new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
          })
        )
      } catch (error) {
        console.error('R2 download error:', error)
        return NextResponse.json(
          { code: 'NOT_FOUND', message: 'File not found in storage' } as DownloadError,
          { status: 404 }
        )
      }

      const body = objectResponse.Body as
        | { transformToWebStream?: () => ReadableStream<Uint8Array> }
        | undefined

      if (!body || typeof body.transformToWebStream !== 'function') {
        return NextResponse.json(
          { code: 'UNKNOWN', message: 'Unable to stream file' } as DownloadError,
          { status: 500 }
        )
      }

      // Increment only on actual download stream start.
      await supabaseAdmin!
        .from('files')
        .update({ downloaded_count: data.downloaded_count + 1 })
        .eq('code', code.toUpperCase())

      const safeFilename = encodeURIComponent(data.filename)
      const headers = new Headers()
      
      // Force application/octet-stream for PDFs to prevent Safari Mobile from opening inline
      const mimeType = objectResponse.ContentType || data.mime_type || 'application/octet-stream'
      const contentType = mimeType === 'application/pdf' ? 'application/octet-stream' : mimeType
      
      headers.set('Content-Type', contentType)
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`)

      if (typeof objectResponse.ContentLength === 'number') {
        headers.set('Content-Length', objectResponse.ContentLength.toString())
      }

      return new NextResponse(body.transformToWebStream(), {
        status: 200,
        headers,
      })
    }

    // Return file metadata with a backend download URL.
    const response: DownloadResponse = {
      downloadUrl: `/api/get-file?code=${code.toUpperCase()}&download=1`,
      filename: data.filename,
      fileSize: data.file_size,
      expiresAt: data.expires_at,
      expiresIn: Math.ceil((expiresAt.getTime() - now.getTime()) / (60 * 1000)),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get file error:', error)
    return NextResponse.json(
      { code: 'UNKNOWN', message: 'An unexpected error occurred' } as DownloadError,
      { status: 500 }
    )
  }
}
