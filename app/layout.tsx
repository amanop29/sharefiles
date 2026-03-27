import type { Metadata, Viewport } from 'next'
import { type ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/next'
import '@/app/styles/globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  title: 'ShareFiles — Anonymous File Sharing',
  description: 'Share files anonymously with secure expiration. No signup required.',
  openGraph: {
    title: 'ShareFiles — Anonymous File Sharing',
    description: 'No account. No storage. No tracking.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShareFiles — Anonymous File Sharing',
    description: 'No account. No storage. No tracking.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
