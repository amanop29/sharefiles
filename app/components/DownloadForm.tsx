'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { isValidCodeFormat } from '@/app/lib/codeGenerator'
import { formatFileSize, getTimeRemaining } from '@/app/lib/utils'
import clsx from 'clsx'

interface DownloadFormProps {
  onDownload: (code: string) => Promise<void>
  initialCode?: string
}

interface FileData {
  downloadUrl: string
  filename: string
  fileSize: number
  expiresAt: string
  expiresIn: number
}

function extractCodeFromInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const directCode = trimmed.toUpperCase()
  if (isValidCodeFormat(directCode)) {
    return directCode
  }

  try {
    const url = new URL(trimmed)
    const codeFromQuery = url.searchParams.get('code')?.toUpperCase() ?? ''
    if (isValidCodeFormat(codeFromQuery)) {
      return codeFromQuery
    }
  } catch {
    // Not a valid absolute URL; continue with regex fallback.
  }

  const queryMatch = trimmed.match(/[?&]code=([A-Za-z0-9]{6})/i)
  if (queryMatch?.[1]) {
    const extracted = queryMatch[1].toUpperCase()
    if (isValidCodeFormat(extracted)) {
      return extracted
    }
  }

  return ''
}

export function DownloadForm({ onDownload, initialCode }: DownloadFormProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [, setNow] = useState(Date.now())

  const lookupCode = useCallback(async (inputCode: string) => {
    setError(null)

    const normalizedCode = extractCodeFromInput(inputCode)

    if (!inputCode.trim()) {
      setError('Please enter a code or share link')
      return
    }

    if (!normalizedCode) {
      setError('Invalid code or link format')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/get-file?code=${normalizedCode}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('File not found')
        } else if (response.status === 410) {
          setError('File has expired')
        } else {
          setError('Failed to retrieve file')
        }
        setFileData(null)
        return
      }

      const data = await response.json()
      setFileData(data)
      setCode(normalizedCode)
      await onDownload(normalizedCode)
    } catch {
      setError('An error occurred')
      setFileData(null)
    } finally {
      setLoading(false)
    }
  }, [onDownload])

  useEffect(() => {
    if (!initialCode) return

    setCode(initialCode)
    const normalized = extractCodeFromInput(initialCode)
    if (normalized) {
      void lookupCode(normalized)
    }
  }, [initialCode, lookupCode])

  useEffect(() => {
    if (!fileData) return

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [fileData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await lookupCode(code)
  }

  const handleDirectDownload = () => {
    if (fileData) {
      const link = document.createElement('a')
      link.href = fileData.downloadUrl
      link.download = fileData.filename
      link.click()
    }
  }

  if (fileData) {
    const timeRemaining = getTimeRemaining(new Date(fileData.expiresAt))
    
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50">Ready to Download</h3>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Filename</p>
          <p className="font-medium text-gray-900 dark:text-gray-50 break-all">{fileData.filename}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(fileData.fileSize)}</p>
        </div>

        <div className="text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Expires in <span className={clsx(
              'font-semibold',
              timeRemaining.isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
            )}>
              {timeRemaining.text}
            </span>
          </p>
        </div>

        <button
          onClick={handleDirectDownload}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Now
        </button>

        <button
          onClick={() => {
            setCode('')
            setFileData(null)
            setError(null)
          }}
          className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
        >
          Search Another Code
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter Download Code or Link
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder="ABCDEF"
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50',
            error
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-700'
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className={clsx(
          'w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
          loading || !code.trim()
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
        )}
      >
        <Download className="w-5 h-5" />
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
