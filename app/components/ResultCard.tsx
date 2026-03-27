'use client'

import { Copy, Check, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyToClipboard, getTimeRemaining } from '@/app/lib/utils'

interface ResultCardProps {
  code: string
  filename: string
  expiresAt: string
  onReset: () => void
}

export function ResultCard({ code, filename, expiresAt, onReset }: ResultCardProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [remaining, setRemaining] = useState(() => getTimeRemaining(new Date(expiresAt)))

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemaining(getTimeRemaining(new Date(expiresAt)))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [expiresAt])

  const handleCopyCode = async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleCopyLink = async () => {
    const link = `${window.location.origin}?code=${code}`
    const success = await copyToClipboard(link)
    if (success) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="result-card">
      {/* Header */}
      <div className="result-card-header">
        <div className="result-card-icon">
          <Check />
        </div>
        <h3 className="result-card-heading">{filename} uploaded</h3>
      </div>

      {/* Code section */}
      <div style={{ marginBottom: '24px' }}>
        <label className="result-card-label">Share Code</label>
        <div className="result-code-row">
          <div className="result-code-box">{code}</div>
          <button
            type="button"
            onClick={handleCopyCode}
            className={`btn-copy-icon ${copiedCode ? 'copied' : ''}`}
            aria-label={copiedCode ? 'Code copied' : 'Copy share code'}
            title={copiedCode ? 'Copied' : 'Copy code'}
          >
            {copiedCode ? (
              <Check style={{ width: '16px', height: '16px' }} />
            ) : (
              <Copy style={{ width: '16px', height: '16px' }} />
            )}
          </button>
        </div>

        <p className="result-help-text">Share the code or link with others to download</p>

        <label className="result-card-label" style={{ marginTop: '14px' }}>Download Link</label>
        <div className="result-link-button-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-secondary btn-small"
            style={{ width: '100%' }}
          >
            {copiedLink ? (
              <>
                <Check style={{ width: '16px', height: '16px' }} />
                Link Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: '16px', height: '16px' }} />
                Copy download link
              </>
            )}
          </button>
        </div>

        {/* Expiry info */}
        <div className="result-expiry">
          <Clock />
          <span>Expires in {remaining.text}</span>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="btn-secondary"
      >
        Upload Another File
      </button>
    </div>
  )
}
