// Cloudflare R2 client initialization

import { S3Client } from '@aws-sdk/client-s3'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing Cloudflare R2 configuration')
}

export const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'share-files'
export const R2_ACCOUNT_ID = accountId
