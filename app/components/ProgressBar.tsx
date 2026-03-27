'use client'

interface ProgressBarProps {
  progress: number
  isVisible?: boolean
  stageText?: string
  statusText?: string
  isIndeterminate?: boolean
}

export function ProgressBar({
  progress,
  isVisible = true,
  stageText,
  statusText,
  isIndeterminate = false,
}: ProgressBarProps) {
  if (!isVisible) return null

  return (
    <div style={{ width: '100%' }}>
      {stageText && (
        <p 
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--ink3)',
            textAlign: 'center',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {stageText}
        </p>
      )}
      
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ 
            width: `${progress}%`,
            animation: isIndeterminate ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      
      <p className="progress-label">{Math.round(progress)}%</p>
      
      {statusText && (
        <p 
          style={{
            fontSize: '12px',
            color: 'var(--ink3)',
            textAlign: 'center',
            marginTop: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {statusText}
        </p>
      )}
    </div>
  )
}
