'use client'

import { Download } from 'lucide-react'
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

    const renderQr = async () => {
      if (!container) return
      const { default: QRCodeStyling } = await import('qr-code-styling')
      const QRCodeStylingClass = QRCodeStyling as unknown as QRCodeStylingCtor
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
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const width = Number(svg.getAttribute('width')) || 200
        const height = Number(svg.getAttribute('height')) || 200
        const exportScale = 8
        canvas.width = width * exportScale
        canvas.height = height * exportScale
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(svgUrl)
          return
        }

        ctx.imageSmoothingEnabled = false
        ctx.setTransform(exportScale, 0, 0, exportScale, 0, 0)
        ctx.fillStyle = '#f7f5f0'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `sharefiles-${code}.png`
        link.click()

        URL.revokeObjectURL(svgUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
      }

      img.src = svgUrl
      return
    }

    if (qrCodeRef.current) {
      qrCodeRef.current.download({ name: `sharefiles-${code}`, extension: 'png' })
    }
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
