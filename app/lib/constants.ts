// Constants for the ShareFiles app

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/xml',
  'text/xml',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/webm',
  
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',

  // Code and markup
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/typescript',
  'text/x-python',
  'application/x-python-code',
  'application/json',
  'application/x-sh',
  'text/x-shellscript',
  'application/sql',
  'text/markdown',
]

export const EXPIRY_OPTIONS = {
  15: '15 minutes',
  60: '1 hour',
  1440: '24 hours',
} as const

export const EXPIRY_LABELS = {
  15: '15m',
  60: '1h',
  1440: '24h',
} as const

export const CODE_LENGTH = 6

// Characters to use for code generation (excluding confusing chars: I, L, O, 0, 1)
export const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const API_ROUTES = {
  UPLOAD: '/api/upload',
  GET_FILE: '/api/get-file',
  DELETE_EXPIRED: '/api/delete-expired',
} as const

// Extensions that should be accepted even when browsers send generic/empty MIME types.
export const ALLOWED_FILE_EXTENSIONS = [
  // Code and markup
  'py',
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'json',
  'xml',
  'yaml',
  'yml',
  'toml',
  'ini',
  'md',
  'sql',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'bat',
  'cmd',
  'c',
  'h',
  'cpp',
  'cc',
  'cxx',
  'hpp',
  'java',
  'kt',
  'swift',
  'go',
  'rs',
  'php',
  'rb',
  'pl',
  'r',
  'dart',
  'scala',
  'lua',
  'vue',
  'svelte',

  'ods',
  // Common Tally-related files
  'tsf',
  'tdl',
  'tcp',
  'tbk',
] as const
