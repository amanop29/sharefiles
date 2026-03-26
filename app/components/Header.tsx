'use client'

import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            ShareFiles
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Anonymous file sharing</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
