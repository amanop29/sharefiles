'use client'

export function Footer() {
  return (
    <footer style={{
      borderTop: '1.5px solid var(--border2)',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '80px',
      fontSize: '12px',
      color: 'var(--ink3)',
      flexWrap: 'wrap',
      gap: '16px',
    }}>
      {/* Left */}
      <div>
        © 2026 ShareFiles. All rights reserved.
      </div>
    </footer>
  )
}
