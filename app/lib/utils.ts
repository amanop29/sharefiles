// Utility functions

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Calculate time remaining until expiry
 */
export function getTimeRemaining(expiresAt: Date): {
  minutes: number
  seconds: number
  text: string
  isExpired: boolean
} {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return {
      minutes: 0,
      seconds: 0,
      text: 'Expired',
      isExpired: true,
    }
  }

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  let text = ''
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    text = hours > 0 ? `${days}d ${hours}h` : `${days}d`
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    text = `${hours}h ${minutes % 60}m`
  } else {
    text = `${minutes}m ${seconds}s`
  }

  return {
    minutes,
    seconds,
    text,
    isExpired: false,
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
