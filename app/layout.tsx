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
      </body>
    </html>
  )
}
