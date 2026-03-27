'use client'

import { EXPIRY_LABELS, EXPIRY_OPTIONS } from '@/app/lib/constants'
import { ExpiryMinutes } from '@/app/lib/types'

interface ExpirySelectorProps {
  selected: ExpiryMinutes | null
  onChange: (minutes: ExpiryMinutes) => void
  disabled?: boolean
}

export function ExpirySelector({ selected, onChange, disabled }: ExpirySelectorProps) {
  const options: ExpiryMinutes[] = [15, 60, 1440, 10080]
  const descriptions: Record<ExpiryMinutes, string> = {
    15: 'Quick share',
    60: 'Standard',
    1440: 'Keep longer',
    10080: 'One week',
  }

  return (
    <div className="expiry-selector">
      <label className="expiry-label">Expiry Time</label>
      
      <div className="expiry-options">
        {options.map((minutes) => (
          <button
            key={minutes}
            onClick={() => !disabled && onChange(minutes)}
            disabled={disabled}
            className={`expiry-option ${selected === minutes ? 'active' : ''}`}
            style={{
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="expiry-option-time">{EXPIRY_LABELS[minutes as ExpiryMinutes]}</span>
            <span className="expiry-option-description">{descriptions[minutes as ExpiryMinutes]}</span>
          </button>
        ))}
      </div>

      {selected && (
        <p className="expiry-note">
          File will expire in {EXPIRY_OPTIONS[selected as ExpiryMinutes]}
        </p>
      )}
    </div>
  )
}
