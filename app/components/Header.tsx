'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onGoToUpload?: () => void
}

export function Header({ onGoToUpload }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '64px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        backgroundColor: 'color-mix(in srgb, var(--paper) 82%, transparent)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100%',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Link
          href="/"
          onClick={onGoToUpload}
          style={{ display: 'flex', alignItems: 'baseline', gap: '2px', textDecoration: 'none' }}
          aria-label="Go to upload"
        >
          <span
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: '38px',
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              lineHeight: 1,
            }}
          >
            Share
          </span>
          <span
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: '38px',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            Files
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
