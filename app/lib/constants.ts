// Constants for the ShareFiles app

export const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB per file
export const MAX_TOTAL_UPLOAD_SIZE = 1024 * 1024 * 1024 // 1GB per upload

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
  'image/vnd.adobe.photoshop', // Adobe Photoshop
  'image/x-coreldraw', // Corel Draw
  
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
  'application/x-ipynb+json', // Jupyter notebooks
]

export const EXPIRY_OPTIONS = {
  15: '15 minutes',
  60: '1 hour',
  1440: '24 hours',
  10080: '7 days',
} as const

export const EXPIRY_LABELS = {
  15: '15m',
  60: '1h',
  1440: '24h',
  10080: '7d',
} as const

export const CODE_LENGTH = 6

// Characters to use for code generation (excluding confusing chars: I, L, O, 0, 1)
export const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

// Extensions that should be accepted even when browsers send generic/empty MIME types.
export const ALLOWED_FILE_EXTENSIONS = [
  // Documents and office files
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'rtf',

  // Archives
  'zip',
  'rar',
  '7z',
  'gz',
  'tgz',
  'tar',
  'bz2',

  // Images
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'heic',

  // Audio
  'mp3',
  'wav',
  'm4a',

  // Video
  'mp4',
  'mov',
  'avi',

  // Code and markup
  'py',
  'pyc',
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
  // Jupyter notebooks
  'ipynb',
  // Design software
  'psd', // Adobe Photoshop
  'cdr', // Corel Draw
] as const
