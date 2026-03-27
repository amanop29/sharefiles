import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'

const ORPHAN_GRACE_MS = 2 * 60 * 60 * 1000

function extractFileKeyFromUrl(fileUrl: string, fallbackCode: string, fallbackFilename: string) {
  try {
    const parsedUrl = new URL(fileUrl)
    const pathname = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''))
    if (pathname) {
      return pathname
    }
  } catch {
    // Ignore malformed URL and fallback to derived key.
  }

  return `${fallbackCode}/${fallbackFilename}`
}

function getCodeFromObjectKey(key: string) {
  const prefix = key.split('/')[0] || ''
  return /^[A-Z0-9]{6}$/.test(prefix) ? prefix : null
}

async function deleteExpiredFiles() {
  const { data: expiredFiles, error: queryError } = await supabaseAdmin!
    .from('files')
    .select('*')
    .lt('expires_at', new Date().toISOString())

  if (queryError) {
    console.error('Query error:', queryError)
    return {
      deletedCount: 0,
      errors: [`Database query failed: ${queryError.message}`],
    }
  }

  if (!expiredFiles || expiredFiles.length === 0) {
    return {
      deletedCount: 0,
      errors: [] as string[],
    }
  }

  let deletedCount = 0
  const errors: string[] = []

  for (const file of expiredFiles) {
    try {
      const fileKey = extractFileKeyFromUrl(file.file_url, file.code, file.filename)
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
        })
      )

      const { error: deleteError } = await supabaseAdmin!
        .from('files')
        .delete()
        .eq('id', file.id)

      if (deleteError) {
        errors.push(`Failed to delete metadata for ${file.code}: ${deleteError.message}`)
      } else {
        deletedCount++
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to delete file ${file.code}: ${errorMsg}`)
    }
  }

  return {
    deletedCount,
    errors,
  }
}

async function deleteOrphanObjects() {
  let continuationToken: string | undefined
  let scannedObjectCount = 0
  let orphanDeletedCount = 0
  const errors: string[] = []
  const now = Date.now()

  do {
    let listResponse
    try {
      listResponse = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      )
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to list objects for orphan cleanup: ${errorMsg}`)
      break
    }

    const contents = listResponse.Contents || []
    scannedObjectCount += contents.length

    const codeToKeys = new Map<string, string[]>()

    for (const object of contents) {
      if (!object.Key || !object.LastModified) {
        continue
      }

      if (now - object.LastModified.getTime() < ORPHAN_GRACE_MS) {
        continue
      }

      const code = getCodeFromObjectKey(object.Key)
      if (!code) {
        continue
      }

      const keys = codeToKeys.get(code) || []
      keys.push(object.Key)
      codeToKeys.set(code, keys)
    }

    const candidateCodes = [...codeToKeys.keys()]
    if (candidateCodes.length > 0) {
      const { data: existingCodes, error } = await supabaseAdmin!
        .from('files')
        .select('code')
        .in('code', candidateCodes)

      if (error) {
        errors.push(`Failed to verify orphan candidates: ${error.message}`)
      } else {
        const existingCodeSet = new Set((existingCodes || []).map((row) => row.code))

        for (const [code, keys] of codeToKeys.entries()) {
          if (existingCodeSet.has(code)) {
            continue
          }

          for (const key of keys) {
            try {
              await r2Client.send(
                new DeleteObjectCommand({
                  Bucket: R2_BUCKET_NAME,
                  Key: key,
                })
              )
              orphanDeletedCount++
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error'
              errors.push(`Failed to delete orphan object ${key}: ${errorMsg}`)
            }
          }
        }
      }
    }

    continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined
  } while (continuationToken)

  return {
    orphanDeletedCount,
    scannedObjectCount,
    errors,
  }
}

async function runCleanup() {
  const expiredResult = await deleteExpiredFiles()
  const orphanResult = await deleteOrphanObjects()

  const errors = [...expiredResult.errors, ...orphanResult.errors]

  return NextResponse.json(
    {
      message: `Cleanup completed. Deleted ${expiredResult.deletedCount} expired files and ${orphanResult.orphanDeletedCount} orphan objects.`,
      deleted_count: expiredResult.deletedCount,
      orphan_deleted_count: orphanResult.orphanDeletedCount,
      scanned_objects: orphanResult.scannedObjectCount,
      errors: errors.length > 0 ? errors : undefined,
      status: 'success',
    },
    { status: 200 }
  )
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '')
}

export async function POST(request: NextRequest) {
  try {
    const secret = getBearerToken(request)

    if (secret !== process.env.CLEANUP_API_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return await runCleanup()
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 })
  }
}

// GET is used by Vercel Cron. In development, it remains open for quick checks.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    try {
      const { data: expiredFiles } = await supabaseAdmin!
        .from('files')
        .select('*')
        .lt('expires_at', new Date().toISOString())

      return NextResponse.json(
        {
          message: 'Found expired files',
          count: expiredFiles?.length || 0,
          files: expiredFiles,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error:', error)
      return NextResponse.json({ message: 'Error' }, { status: 500 })
    }
  }

  try {
    const secret = getBearerToken(request)
    const cronSecret = process.env.CRON_SECRET
    const cleanupSecret = process.env.CLEANUP_API_SECRET

    const isAuthorized =
      (!!cronSecret && secret === cronSecret) ||
      (!!cleanupSecret && secret === cleanupSecret)

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return await runCleanup()
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 })
  }
}
