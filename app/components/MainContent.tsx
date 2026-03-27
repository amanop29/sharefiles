'use client'

import { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main 
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px 80px',
      }}
    >
      {children}
    </main>
  )
}
