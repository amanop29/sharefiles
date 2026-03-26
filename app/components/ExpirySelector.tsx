'use client'

import { EXPIRY_LABELS, EXPIRY_OPTIONS } from '@/app/lib/constants'
import { ExpiryMinutes } from '@/app/lib/types'
import clsx from 'clsx'

interface ExpirySelectorProps {
  selected: ExpiryMinutes | null
  onChange: (minutes: ExpiryMinutes) => void
  disabled?: boolean
}

export function ExpirySelector({ selected, onChange, disabled }: ExpirySelectorProps) {
  const options: ExpiryMinutes[] = [15, 60, 1440]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Expiry Time
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((minutes) => (
          <button
            key={minutes}
            onClick={() => onChange(minutes)}
            disabled={disabled}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all duration-200',
              selected === minutes
                ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {EXPIRY_LABELS[minutes]}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          File will expire in {EXPIRY_OPTIONS[selected]}
        </p>
      )}
    </div>
  )
}
