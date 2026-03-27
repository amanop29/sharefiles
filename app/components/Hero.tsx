'use client'

export function Hero() {
  return (
    <section 
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '56px 40px 64px',
        textAlign: 'center',
      }}
      className="fade-up"
    >
      {/* Eyebrow */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--ink3)' }} />
        <span 
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink3)',
          }}
        >
          Share Securely
        </span>
        <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--ink3)' }} />
      </div>

      {/* H1 */}
      <h1 
        style={{
          fontFamily: `'Instrument Serif', serif`,
          fontSize: 'clamp(40px, 6.8vw, 62px)',
          fontWeight: '400',
          letterSpacing: '-0.03em',
          lineHeight: '1.05',
          color: 'var(--ink)',
          marginBottom: '20px',
          maxWidth: '900px',
          margin: '0 auto 20px',
        }}
      >
        Share files,<br />
        <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>leave no trace.</span>
      </h1>

      {/* Subtitle */}
      <p 
        style={{
          fontSize: '14px',
          color: 'var(--ink3)',
          maxWidth: '380px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}
      >
        Anonymous file sharing with automatic expiration. 
        No account, no tracking, no hassle.
      </p>
    </section>
  )
}
