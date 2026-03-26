'use client'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8 space-y-4">
      <div className="space-y-2 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Files automatically delete after expiry. No storage, no tracking.
        </p>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          © 2026 ShareFiles. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
