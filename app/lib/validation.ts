// Validation schemas using Zod

import { z } from 'zod'
import { MAX_FILE_SIZE } from './constants'

export const uploadQuerySchema = z.object({
  expiryMinutes: z.enum(['15', '60', '1440']).transform(Number),
})

export const uploadBodySchema = z.object({
  filename: z.string().min(1).max(255),
  fileSize: z.number().positive().max(MAX_FILE_SIZE),
  mimeType: z.string(),
  expiryMinutes: z.enum(['15', '60', '1440']).transform(Number),
})

export const getFileQuerySchema = z.object({
  code: z.string().length(6).toUpperCase(),
})

export const deleteExpiredBodySchema = z.object({
  secret: z.string(),
})

// Type exports
export type UploadQuery = z.infer<typeof uploadQuerySchema>
export type UploadBody = z.infer<typeof uploadBodySchema>
export type GetFileQuery = z.infer<typeof getFileQuerySchema>
export type DeleteExpiredBody = z.infer<typeof deleteExpiredBodySchema>
