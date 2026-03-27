'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/app/components/Header'
import { Hero } from '@/app/components/Hero'
import { MainContent } from '@/app/components/MainContent'
import { UploadBox } from '@/app/components/UploadBox'
import { ExpirySelector } from '@/app/components/ExpirySelector'
import { ProgressBar } from '@/app/components/ProgressBar'
import { ResultCard } from '@/app/components/ResultCard'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { DownloadForm } from '@/app/components/DownloadForm'
import { HowItWorks } from '@/app/components/HowItWorks'
import { Footer } from '@/app/components/Footer'
import { UploadInputFile } from '@/app/components/UploadBox'
import { ExpiryMinutes, UploadResponse } from '@/app/lib/types'

export default function Home() {
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle')
  const [selectedFiles, setSelectedFiles] = useState<UploadInputFile[]>([])
  const [expiryMinutes, setExpiryMinutes] = useState<ExpiryMinutes>(60)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedCode, setUploadedCode] = useState<string | null>(null)
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload')
  const [prefillDownloadCode, setPrefillDownloadCode] = useState('')

  // Handle URL code parameter for download
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')
    if (codeFromUrl) {
      setActiveTab('download')
      setPrefillDownloadCode(codeFromUrl.toUpperCase())
    }
  }, [])

  const handleFileSelect = (files: UploadInputFile[]) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files])
    setUploadError(null)
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  const handleRemoveFolder = (folderPath: string) => {
    const normalizedPrefix = `${folderPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')}/`
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => {
        const relativePath = (file.webkitRelativePath || file.path || file.name)
          .replace(/\\/g, '/')
          .replace(/^\/+/, '')
        return !relativePath.startsWith(normalizedPrefix)
      })
    )
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !expiryMinutes) {
      setUploadError('Please select at least one file and expiry time')
      return
    }

    setIsUploading(true)
    setUploadStage('uploading')
    setUploadError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append('files', file)
        const relativePath = file.webkitRelativePath || file.path || file.name
        formData.append('paths', relativePath)
      })
      formData.append('expiryMinutes', expiryMinutes.toString())

      const xhr = new XMLHttpRequest()

      // Track bytes sent; keep a small gap until server confirms completion.
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const rawProgress = Math.round((e.loaded / e.total) * 100)
          const progress = Math.min(99, rawProgress)
          setUploadProgress(progress)

          if (rawProgress >= 100) {
            setUploadStage('processing')
          }
        }
      })

      const parseResponseBody = () => {
        try {
          return JSON.parse(xhr.responseText)
        } catch {
          return null
        }
      }

      await new Promise<void>((resolve) => {
        xhr.addEventListener('load', () => {
          const body = parseResponseBody()

          if (xhr.status === 201 && body) {
            const response = body as UploadResponse
            setUploadedCode(response.code)
            setUploadResponse(response)
            setSelectedFiles([])
            setUploadProgress(100)
            setUploadStage('idle')
            resolve()
            return
          }

          if (xhr.status === 413) {
            setUploadError('File is too large. Please upload files below 100MB each.')
          } else {
            const message =
              (body && typeof body.message === 'string' && body.message) ||
              xhr.statusText ||
              'Upload failed'
            setUploadError(message)
          }

          setUploadProgress(0)
          setUploadStage('idle')
          resolve()
        })

        xhr.addEventListener('error', () => {
          setUploadError('Network error during upload')
          setUploadProgress(0)
          setUploadStage('idle')
          resolve()
        })

        xhr.addEventListener('timeout', () => {
          setUploadError('Upload timed out. Please try again.')
          setUploadProgress(0)
          setUploadStage('idle')
          resolve()
        })

        xhr.addEventListener('abort', () => {
          setUploadError('Upload was cancelled')
          setUploadProgress(0)
          setUploadStage('idle')
          resolve()
        })

        xhr.timeout = 180000
        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
      setUploadStage('idle')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFiles([])
    setUploadedCode(null)
    setUploadResponse(null)
    setUploadError(null)
    setUploadProgress(0)
    setExpiryMinutes(60)
    setUploadStage('idle')
  }

  const handleDownload = async () => {
    // File data is fetched in DownloadForm component
  }

  const handleNewUpload = () => {
    handleReset()
    setActiveTab('upload')
    setPrefillDownloadCode('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/')
    }
  }

  const handleGoToUpload = () => {
    handleReset()
    setActiveTab('upload')
    setPrefillDownloadCode('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)' }}>
      <Header onGoToUpload={handleGoToUpload} />

      <Hero />

      <MainContent>
        {/* Tab Navigation */}
        <div className="tabs fade-up fade-up-delay-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          >
            {uploadedCode ? 'Code' : 'Upload'}
          </button>
          {uploadedCode && (
            <button
              onClick={handleNewUpload}
              className="tab"
            >
              New Upload
            </button>
          )}
          <button
            onClick={() => setActiveTab('download')}
            className={`tab ${activeTab === 'download' ? 'active' : ''}`}
          >
            Download
          </button>
        </div>

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <section style={{ marginBottom: '64px' }} className="fade-up fade-up-delay-2">
            {uploadedCode && uploadResponse ? (
              <div className="upload-result-layout">
                <ResultCard
                  code={uploadedCode}
                  filename={uploadResponse.filename}
                  expiresAt={uploadResponse.expiresAt}
                  onReset={handleReset}
                />
                <QRCodeDisplay code={uploadedCode} filename={uploadResponse.filename} />
              </div>
            ) : (
              <>
                <div className="upload-workspace-layout">
                  <div className="upload-column-left">
                    <UploadBox
                      onFileSelect={handleFileSelect}
                      onRemoveFile={handleRemoveFile}
                      onRemoveFolder={handleRemoveFolder}
                      disabled={isUploading}
                      selectedFiles={selectedFiles}
                    />

                    {uploadProgress > 0 && (
                      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                        <ProgressBar
                          progress={uploadProgress}
                          stageText={
                            uploadStage === 'processing'
                              ? 'Step 2 of 2: Creating secure link'
                              : 'Step 1 of 2: Uploading your files'
                          }
                          statusText={
                            uploadStage === 'processing'
                              ? 'Upload complete. Generating your share code...'
                              : 'Uploading files...'
                          }
                          isIndeterminate={uploadStage === 'processing'}
                        />
                      </div>
                    )}

                    <ExpirySelector
                      selected={expiryMinutes}
                      onChange={setExpiryMinutes}
                      disabled={isUploading}
                    />

                    {uploadError && (
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: 'rgba(220, 38, 38, 0.1)',
                          border: '1px solid var(--red)',
                          borderRadius: '12px',
                          marginBottom: '24px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '14px',
                            color: 'var(--red)',
                          }}
                        >
                          {uploadError}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || isUploading}
                      className="btn-primary upload-submit-btn"
                    >
                      {isUploading
                        ? uploadStage === 'processing'
                          ? 'Generating Share Code...'
                          : 'Uploading...'
                        : selectedFiles.length > 1
                          ? 'Upload & Zip Files'
                          : 'Upload File'}
                    </button>
                  </div>

                  <aside className="upload-column-right fade-up fade-up-delay-3">
                    <div className="upload-download-widget">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3
                          style={{
                            fontFamily: `'Instrument Serif', serif`,
                            fontSize: '32px',
                            fontWeight: '400',
                            color: 'var(--ink)',
                            marginBottom: '6px',
                          }}
                        >
                          Download <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>a file</span>
                        </h3>
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--ink3)',
                          }}
                        >
                          Enter the code to search
                        </p>
                      </div>
                      <DownloadForm onDownload={handleDownload} />
                    </div>
                  </aside>
                </div>
              </>
            )}
          </section>
        )}

        {/* Download Section */}
        {activeTab === 'download' && (
          <section 
            style={{
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '64px',
            }}
            className="fade-up fade-up-delay-2"
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 
                style={{
                  fontFamily: `'Instrument Serif', serif`,
                  fontSize: '36px',
                  fontWeight: '400',
                  color: 'var(--ink)',
                  marginBottom: '8px',
                }}
              >
                Download <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>a file</span>
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--ink3)',
              }}>
                Enter the code you received to download
              </p>
            </div>
            <DownloadForm onDownload={handleDownload} initialCode={prefillDownloadCode} />
          </section>
        )}

        {/* How It Works Section */}
        {activeTab === 'upload' && !uploadedCode && <HowItWorks />}
      </MainContent>

      <Footer />
    </div>
  )
}
