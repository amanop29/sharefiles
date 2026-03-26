'use client'

interface ProgressBarProps {
  progress: number
  isVisible?: boolean
}

export function ProgressBar({ progress, isVisible = true }: ProgressBarProps) {
  if (!isVisible) return null

  return (
    <div className="w-full space-y-2">
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{Math.round(progress)}%</p>
    </div>
  )
}
