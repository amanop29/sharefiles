'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/app/components/Header'
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

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText) as UploadResponse
          setUploadedCode(response.code)
          setUploadResponse(response)
          setSelectedFiles([])
          setUploadProgress(0)
        } else {
          const error = JSON.parse(xhr.responseText)
          setUploadError(error.message || 'Upload failed')
          setUploadProgress(0)
        }
      })

      xhr.addEventListener('error', () => {
        setUploadError('Network error during upload')
        setUploadProgress(0)
      })

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
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
  }

  const handleDownload = async () => {
    // File data is fetched in DownloadForm component
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'download'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
            }`}
          >
            Download
          </button>
        </div>

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <section className="space-y-8">
            {uploadedCode && uploadResponse ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <UploadBox
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  onRemoveFolder={handleRemoveFolder}
                  disabled={isUploading}
                  selectedFiles={selectedFiles}
                />

                <ExpirySelector
                  selected={expiryMinutes}
                  onChange={setExpiryMinutes}
                  disabled={isUploading}
                />

                {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}

                {uploadError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                    selectedFiles.length === 0 || isUploading
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-700 dark:hover:from-blue-600 dark:hover:to-cyan-600'
                  }`}
                >
                  {isUploading ? 'Uploading...' : selectedFiles.length > 1 ? 'Upload & Zip Files' : 'Upload File'}
                </button>
              </>
            )}
          </section>
        )}

        {/* Download Section */}
        {activeTab === 'download' && (
          <section className="space-y-8 max-w-md mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Download a File</h2>
              <p className="text-gray-600 dark:text-gray-400">Enter the code you received</p>
            </div>
            <DownloadForm onDownload={handleDownload} initialCode={prefillDownloadCode} />
          </section>
        )}

        {/* How It Works Section */}
        {activeTab === 'upload' && !uploadedCode && <HowItWorks />}
      </main>

      <div className="max-w-4xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  )
}
