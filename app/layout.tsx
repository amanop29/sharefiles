import type { Metadata, Viewport } from 'next'
import { type ReactNode } from 'react'
import '@/app/styles/globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  title: 'ShareFiles - Anonymous File Sharing',
  description: 'Share files anonymously with secure expiration. No signup required.',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
