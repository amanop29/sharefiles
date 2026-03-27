import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '760px',
          textAlign: 'center',
          border: '1.5px solid var(--border2)',
          borderRadius: '16px',
          backgroundColor: 'var(--paper2)',
          padding: '48px 28px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink3)',
            marginBottom: '14px',
          }}
        >
          Error 404
        </p>

        <h1
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 'clamp(40px, 6vw, 64px)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '14px',
          }}
        >
          Page not found.
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--ink3)',
            maxWidth: '460px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          The link might be expired, moved, or typed incorrectly. Go back to ShareFiles and start a new upload.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '13px 22px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Back to Upload
          </Link>

          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '13px 22px',
              borderRadius: '12px',
              border: '1.5px solid var(--border2)',
              color: 'var(--ink)',
              fontSize: '15px',
              fontWeight: 500,
              backgroundColor: 'var(--paper)',
            }}
          >
            Go Home
          </Link>
        </div>
      </section>
    </main>
  )
}
