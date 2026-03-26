'use client'

import QRCode from 'qrcode.react'
import { Download } from 'lucide-react'
import { useRef } from 'react'

interface QRCodeDisplayProps {
  code: string
  filename: string
}

export function QRCodeDisplay({ code, filename }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `sharefiles-${code}.png`
      link.click()
    }
  }

  const downloadLink = `${window.location.origin}?code=${code}`

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-50">QR Code</h3>
      
      <div className="flex flex-col items-center gap-4">
        <div
          ref={qrRef}
          className="bg-white p-4 rounded-lg"
        >
          <QRCode
            value={downloadLink}
            size={200}
            level="H"
            includeMargin
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Scan to download {filename}
        </p>
        
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>
      </div>
    </div>
  )
}
