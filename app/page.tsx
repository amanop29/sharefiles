'use client'

import { useState, useEffect } from 'react'
import JSZip from 'jszip'
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
import { MAX_TOTAL_UPLOAD_SIZE } from '@/app/lib/constants'
import { ExpiryMinutes, UploadInitiateResponse, UploadResponse } from '@/app/lib/types'
import { formatFileSize } from '@/app/lib/utils'

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
  const selectedTotalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const exceedsUploadLimit = selectedTotalSize > MAX_TOTAL_UPLOAD_SIZE

  // Handle URL code parameter for download
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')
    if (codeFromUrl) {
      setActiveTab('download')
      setPrefillDownloadCode(codeFromUrl.toUpperCase())
    }
  }, [])

  const sanitizeZipPath = (path: string) => {
    const normalized = path.replace(/\\/g, '/').trim()
    const segments = normalized
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')

    return segments.join('/')
  }

  const addNumberSuffix = (filePath: string, suffixNumber: number) => {
    const normalized = filePath.replace(/\\/g, '/')
    const lastSlash = normalized.lastIndexOf('/')
    const dirname = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : ''
    const basename = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized

    const dotIndex = basename.lastIndexOf('.')
    const hasExtension = dotIndex > 0
    const name = hasExtension ? basename.slice(0, dotIndex) : basename
    const extension = hasExtension ? basename.slice(dotIndex) : ''

    return `${dirname}${name} (${suffixNumber})${extension}`
  }

  const buildUploadBlob = async (files: UploadInputFile[]) => {
    if (files.length === 1) {
      const singleFile = files[0]
      return {
        blob: singleFile,
        fileCount: 1,
      }
    }

    const zip = new JSZip()
    const filenameCounter = new Map<string, number>()

    for (const file of files) {
      const fileBuffer = await file.arrayBuffer()
      const relativePath = file.webkitRelativePath || file.path || file.name
      const safePath = sanitizeZipPath(relativePath) || file.name

      const currentCount = filenameCounter.get(safePath) ?? 0
      filenameCounter.set(safePath, currentCount + 1)

      const zipEntryPath = currentCount === 0 ? safePath : addNumberSuffix(safePath, currentCount + 1)
      zip.file(zipEntryPath, fileBuffer)
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    return {
      blob,
      fileCount: files.length,
    }
  }

  const uploadToPresignedUrl = (uploadUrl: string, blob: Blob, contentType: string) => {
    return new Promise<void>((resolve, reject) => {
      const uploadXhr = new XMLHttpRequest()

      uploadXhr.upload.addEventListener('progress', (e) => {
        if (!e.lengthComputable) {
          return
        }

        const progress = Math.round((e.loaded / e.total) * 100)
        setUploadProgress(Math.min(99, progress))
      })

      uploadXhr.addEventListener('load', () => {
        if (uploadXhr.status >= 200 && uploadXhr.status < 300) {
          setUploadProgress(100)
          resolve()
          return
        }

        reject(new Error('Direct upload to storage failed'))
      })

      uploadXhr.addEventListener('error', () => reject(new Error('Network error during direct upload')))
      uploadXhr.addEventListener('timeout', () => reject(new Error('Direct upload timed out')))
      uploadXhr.addEventListener('abort', () => reject(new Error('Direct upload was cancelled')))

      uploadXhr.timeout = 20 * 60 * 1000
      uploadXhr.open('PUT', uploadUrl)
      uploadXhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream')
      uploadXhr.send(blob)
    })
  }

  const getErrorMessage = (payload: unknown, fallback: string) => {
    if (
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message?: unknown }).message === 'string'
    ) {
      return (payload as { message: string }).message
    }

    return fallback
  }

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

    if (exceedsUploadLimit) {
      setUploadError(
        `Selected files exceed the 1GB upload limit by ${formatFileSize(
          selectedTotalSize - MAX_TOTAL_UPLOAD_SIZE
        )}. Remove some files and try again.`
      )
      return
    }

    setIsUploading(true)
    setUploadStage('processing')
    setUploadError(null)
    setUploadProgress(0)

    try {
      const uploadPayload = await buildUploadBlob(selectedFiles)

      const initiateRes = await fetch('/api/upload/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            path: file.webkitRelativePath || file.path || file.name,
          })),
          expiryMinutes,
        }),
      })

      let initiateBody: UploadInitiateResponse | { message?: string } | null = null
      try {
        initiateBody = await initiateRes.json()
      } catch {
        initiateBody = null
      }

      if (!initiateRes.ok || !initiateBody || !('uploadUrl' in initiateBody)) {
        const message = getErrorMessage(initiateBody, 'Failed to initialize upload')
        throw new Error(message)
      }

      setUploadStage('uploading')
      await uploadToPresignedUrl(
        initiateBody.uploadUrl,
        uploadPayload.blob,
        initiateBody.mimeType || 'application/octet-stream'
      )

      setUploadStage('processing')

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: initiateBody.code,
          fileKey: initiateBody.fileKey,
          filename: initiateBody.filename,
          mimeType: initiateBody.mimeType,
          fileSize: uploadPayload.blob.size,
          fileCount: uploadPayload.fileCount,
          expiryMinutes,
        }),
      })

      let completeBody: UploadResponse | { message?: string } | null = null
      try {
        completeBody = await completeRes.json()
      } catch {
        completeBody = null
      }

      if (!completeRes.ok || !completeBody || !('code' in completeBody)) {
        const message = getErrorMessage(completeBody, 'Failed to finalize upload')
        throw new Error(message)
      }

      setUploadedCode(completeBody.code)
      setUploadResponse(completeBody)
      setSelectedFiles([])
      setUploadProgress(100)
      setUploadStage('idle')
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
                      disabled={selectedFiles.length === 0 || isUploading || exceedsUploadLimit}
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
