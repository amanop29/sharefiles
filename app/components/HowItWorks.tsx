'use client'

import { Upload, Share2, Download } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      step: 'Step 1',
      title: 'Upload Your Files',
      description: 'Drop files or folders, review the stack, and pick an expiry time.',
    },
    {
      icon: Share2,
      step: 'Step 2',
      title: 'Share The Code',
      description: 'Get a unique 6-character code and QR that points to the same download link.',
    },
    {
      icon: Download,
      step: 'Step 3',
      title: 'Download Before Expiry',
      description: 'Recipient enters the code or scans QR and downloads before auto-delete.',
    },
  ]

  return (
    <section className="how-it-works fade-up fade-up-delay-3">
      {/* Header */}
      <div className="how-it-works-header">
        <p className="eyebrow" style={{ marginBottom: '16px' }}>
          How It Works
        </p>
        <h2 className="how-it-works-heading">
          Simple. Fast. <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Gone.</span>
        </h2>
      </div>

      {/* Grid */}
      <div className="how-it-works-grid">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="how-it-works-step"
            >
              {/* Step number */}
              <div className="how-it-works-step-number">{index + 1}</div>

              <p className="how-it-works-step-kicker">{step.step}</p>

              {/* Icon */}
              <div className="how-it-works-step-icon">
                <Icon />
              </div>

              {/* Title */}
              <h3 className="how-it-works-step-title">{step.title}</h3>

              {/* Description */}
              <p className="how-it-works-step-description">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
