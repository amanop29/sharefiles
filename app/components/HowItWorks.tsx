'use client'

import { Upload, Share2, Download } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your File',
      description: 'Select a file (up to 100MB) and choose how long you want to share it',
    },
    {
      icon: Share2,
      title: 'Share the Code',
      description: 'Get a unique 6-character code or QR code to share with anyone',
    },
    {
      icon: Download,
      title: 'Download Before Expiry',
      description: 'Recipients can download your file using the code before it expires',
    },
  ]

  return (
    <section className="py-16 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">How It Works</h2>
        <p className="text-gray-600 dark:text-gray-400">Simple, fast, and secure file sharing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-2xl group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-colors" />
              
              <div className="relative border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Step {index + 1}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {step.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
