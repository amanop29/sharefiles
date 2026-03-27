'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, FileIcon, Check } from 'lucide-react'
import { isValidCodeFormat } from '@/app/lib/codeGenerator'
import { formatFileSize, getTimeRemaining } from '@/app/lib/utils'

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
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
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

  const handleDirectDownload = async () => {
    if (fileData && !downloading) {
      setDownloading(true)
      const link = document.createElement('a')
      link.href = fileData.downloadUrl
      link.download = fileData.filename
      link.click()
      
      setDownloaded(true)
      setTimeout(() => {
        setDownloading(false)
        setDownloaded(false)
      }, 2500)
    }
  }

  if (fileData) {
    const timeRemaining = getTimeRemaining(new Date(fileData.expiresAt))
    
    return (
      <div style={{ marginBottom: '24px' }}>
        {/* Download result card */}
        <div className="download-result-card">
          <div className="download-result-file-icon">
            <FileIcon />
          </div>
          
          <div className="download-result-info">
            <div className="download-result-filename">{fileData.filename}</div>
            <div className="download-result-meta">
              <span>{formatFileSize(fileData.fileSize)}</span>
              <div className="download-result-meta-expiry">
                <span>Expires in {timeRemaining.text}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDirectDownload}
            disabled={downloading}
            className={`download-result-button ${downloaded ? 'downloading' : ''}`}
            style={{
              backgroundColor: downloaded ? 'var(--green)' : 'var(--accent)',
              color: 'white',
            }}
          >
            {downloaded ? (
              <>
                <Check style={{ width: '16px', height: '16px' }} />
                Downloaded!
              </>
            ) : (
              <>
                <Download style={{ width: '16px', height: '16px' }} />
                Download
              </>
            )}
          </button>
        </div>

        {/* Search another code link */}
        <button
          onClick={() => {
            setCode('')
            setFileData(null)
            setError(null)
            setDownloaded(false)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            textAlign: 'center',
            width: '100%',
            paddingTop: '16px',
            fontFamily: `'DM Sans', sans-serif`,
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Search Another Code
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="download-form">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder="ABCDEF"
          disabled={loading}
          style={{
            opacity: loading ? 0.6 : 1,
          }}
        />
        
        <button
          type="submit"
          disabled={loading || code.trim().length < 4}
          className="btn-small"
          style={{
            backgroundColor: (loading || code.trim().length < 4) ? 'var(--paper3)' : 'var(--ink)',
            color: (loading || code.trim().length < 4) ? 'var(--ink3)' : 'var(--paper)',
            cursor: (loading || code.trim().length < 4) ? 'not-allowed' : 'pointer',
            padding: '12px 24px',
          }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid var(--red)',
          borderRadius: '12px',
          fontSize: '14px',
          color: 'var(--red)',
        }}>
          {error}
        </div>
      )}
    </form>
  )
}
