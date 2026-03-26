'use client'

import { Copy, Check } from 'lucide-react'
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
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const remaining = getTimeRemaining(new Date(expiresAt))

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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">✓ File uploaded successfully!</p>
        <p className="text-gray-600 dark:text-gray-400">{filename}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Share Code</label>
        <div className="flex gap-2">
          <code className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-center text-blue-600 dark:text-blue-400">
            {code}
          </code>
          <button
            onClick={handleCopyCode}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Download Link</label>
        <button
          onClick={handleCopyLink}
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              Link copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy download link
            </>
          )}
        </button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Expires in{' '}
          <span
            className={`font-semibold ${
              remaining.isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
            }`}
          >
            {remaining.text}
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Share the code or link with others to download</p>
      </div>

      <button
        onClick={onReset}
        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
      >
        Upload Another File
      </button>
    </div>
  )
}
