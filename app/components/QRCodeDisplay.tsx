'use client'

import { Download } from 'lucide-react'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useMemo, useRef } from 'react'

interface QRCodeDisplayProps {
  code: string
  filename?: string
}

type QRExtension = 'png' | 'jpeg' | 'webp' | 'svg'

type QRCodeStylingInstance = {
  append: (container: HTMLElement) => void
  update: (options: { data?: string; image?: string }) => void
  download: (options: { name: string; extension: QRExtension }) => void
}

type QRCodeStylingCtor = new (options: Record<string, unknown>) => QRCodeStylingInstance

export function QRCodeDisplay({ code }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStylingInstance | null>(null)
  const qrCenterBadge = useMemo(
    () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="7" y="7" width="106" height="106" rx="22" fill="#f7f5f0" stroke="#c9d5ff" stroke-width="2"/><text x="60" y="54" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="20" font-weight="800" fill="#0f0e0c">Share</text><text x="60" y="79" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="21" font-weight="900" fill="#1a56ff">Files</text></svg>'
      )}`,
    []
  )
  const downloadLink = typeof window !== 'undefined' ? `${window.location.origin}?code=${code}` : code

  useEffect(() => {
    let isMounted = true
    const container = qrRef.current
    const QRCodeStylingClass = QRCodeStyling as unknown as QRCodeStylingCtor

    const renderQr = () => {
      if (!container) return
      if (!isMounted) return

      if (!qrCodeRef.current) {
        qrCodeRef.current = new QRCodeStylingClass({
          width: 200,
          height: 200,
          type: 'svg',
          data: downloadLink,
          margin: 4,
          image: qrCenterBadge,
          qrOptions: {
            errorCorrectionLevel: 'H',
          },
          dotsOptions: {
            color: '#1a56ff',
            type: 'dots',
          },
          cornersSquareOptions: {
            color: '#1a56ff',
            type: 'extra-rounded',
          },
          cornersDotOptions: {
            color: '#1a56ff',
            type: 'dot',
          },
          backgroundOptions: {
            color: '#f7f5f0',
          },
          imageOptions: {
            margin: 3,
            imageSize: 0.5,
            hideBackgroundDots: true,
          },
        })
        container.innerHTML = ''
        qrCodeRef.current.append(container)
      } else {
        qrCodeRef.current.update({
          data: downloadLink,
          image: qrCenterBadge,
        })
      }
    }

    renderQr()

    return () => {
      isMounted = false
      if (container) {
        container.innerHTML = ''
      }
      qrCodeRef.current = null
    }
  }, [downloadLink, qrCenterBadge])

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg') as SVGSVGElement | null
    if (!svg) return

    // Use a higher scale for better quality
    const width = 200
    const height = 200
    const scale = 10

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(scale, scale)

    // Render SVG to canvas
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Draw background
      ctx.fillStyle = '#f7f5f0'
      ctx.fillRect(0, 0, width, height)

      // Draw the SVG (which includes the badge)
      ctx.drawImage(img, 0, 0, width, height)

      // Draw the badge text on top as fallback
      const badgeSize = 60
      const badgeX = width / 2 - badgeSize / 2
      const badgeY = height / 2 - badgeSize / 2

      ctx.fillStyle = '#f7f5f0'
      ctx.beginPath()
      ctx.roundRect(badgeX + 4, badgeY + 4, badgeSize - 8, badgeSize - 8, 10)
      ctx.fill()

      ctx.strokeStyle = '#c9d5ff'
      ctx.lineWidth = 1
      ctx.stroke()

      // Share text
      ctx.fillStyle = '#0f0e0c'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Share', width / 2, height / 2 - 8)

      // Files text
      ctx.fillStyle = '#1a56ff'
      ctx.font = 'bold 14px system-ui'
      ctx.fillText('Files', width / 2, height / 2 + 8)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const downUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downUrl
            link.download = `sharefiles-${code}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => URL.revokeObjectURL(downUrl), 100)
          }
          URL.revokeObjectURL(url)
        },
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      console.error('Failed to load SVG for export')
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  return (
    <div className="result-card-section result-qr">
      <div ref={qrRef} className="result-qr-code-wrap">
        <span className="result-qr-loading">Generating QR...</span>
      </div>
      
      <p className="result-qr-label">
        Scan to download the files
      </p>
      
      <button
        onClick={downloadQR}
        className="btn-secondary btn-small"
        style={{ width: '100%' }}
      >
        <Download style={{ width: '16px', height: '16px' }} />
        Save QR
      </button>
    </div>
  )
}
