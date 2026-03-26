import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/app/lib/r2Client'
import { supabaseAdmin } from '@/app/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication secret
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')

    if (secret !== process.env.CLEANUP_API_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find all expired files
    const { data: expiredFiles, error: queryError } = await supabaseAdmin!
      .from('files')
      .select('*')
      .lt('expires_at', new Date().toISOString())

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json({ message: 'Database query failed' }, { status: 500 })
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      return NextResponse.json(
        {
          message: 'No expired files found',
          deleted_count: 0,
          status: 'success',
        },
        { status: 200 }
      )
    }

    let deletedCount = 0
    const errors: string[] = []

    // Delete each expired file
    for (const file of expiredFiles) {
      try {
        // Delete from R2
        const fileKey = `${file.code}/${file.filename}`
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
          })
        )

        // Delete from Supabase
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

    return NextResponse.json(
      {
        message: `Cleanup completed. Deleted ${deletedCount} files.`,
        deleted_count: deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        status: 'success',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 })
  }
}

// Manual trigger endpoint for testing (without authentication)
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ message: 'Not available in production' }, { status: 403 })
  }

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
