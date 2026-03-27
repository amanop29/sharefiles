'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ChevronDown, ChevronRight, Folder, Upload, X } from 'lucide-react'
import { formatFileSize } from '@/app/lib/utils'

export type UploadInputFile = File & {
  path?: string
  webkitRelativePath?: string
}

interface UploadBoxProps {
  onFileSelect: (files: UploadInputFile[]) => void
  onRemoveFile: (index: number) => void
  onRemoveFolder: (folderPath: string) => void
  disabled?: boolean
  selectedFiles: UploadInputFile[]
}

type TreeNode =
  | {
      type: 'folder'
      name: string
      path: string
      children: TreeNode[]
    }
  | {
      type: 'file'
      name: string
      path: string
      index: number
    }

function getRelativePath(file: UploadInputFile) {
  const raw = file.webkitRelativePath || file.path || file.name
  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '')
  const parts = normalized.split('/').filter((part) => part && part !== '.' && part !== '..')
  return parts.length > 0 ? parts.join('/') : file.name
}

function buildTree(files: UploadInputFile[]): TreeNode[] {
  const root: TreeNode = {
    type: 'folder',
    name: '__root__',
    path: '',
    children: [],
  }

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    const relativePath = getRelativePath(file)
    const parts = relativePath.split('/').filter(Boolean)

    let current = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1

      if (isFile) {
        current.children.push({
          type: 'file',
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          index,
        })
        continue
      }

      const nextPath = parts.slice(0, i + 1).join('/')
      let nextFolder = current.children.find(
        (child): child is Extract<TreeNode, { type: 'folder' }> =>
          child.type === 'folder' && child.path === nextPath
      )

      if (!nextFolder) {
        nextFolder = {
          type: 'folder',
          name: part,
          path: nextPath,
          children: [],
        }
        current.children.push(nextFolder)
      }

      current = nextFolder
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    const sorted = [...nodes].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return sorted.map((node) =>
      node.type === 'folder' ? { ...node, children: sortNodes(node.children) } : node
    )
  }

  return sortNodes(root.children)
}

export function UploadBox({
  onFileSelect,
  onRemoveFile,
  onRemoveFolder,
  disabled,
  selectedFiles,
}: UploadBoxProps) {
  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const treeNodes = useMemo(() => buildTree(selectedFiles), [selectedFiles])
  const INDENT_SIZE = 8

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const onDrop = useCallback(
    (acceptedFiles: UploadInputFile[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles)
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
  })

  const renderNodes = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(node.path)
        return (
          <div key={node.path}>
            <div
              className="file-pill"
              style={{
                marginLeft: `${depth * INDENT_SIZE}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 'calc(100% - ' + depth * INDENT_SIZE + 'px)',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFolder(node.path)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                {isExpanded ? (
                  <ChevronDown className="upload-tree-chevron" />
                ) : (
                  <ChevronRight className="upload-tree-chevron" />
                )}
                <span className="upload-tree-folder-name">
                  <Folder className="upload-tree-folder-icon" />
                  {node.name}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFolder(node.path)
                }}
                disabled={disabled}
                className="file-pill-remove"
              >
                <X className="upload-tree-action-icon" />
              </button>
            </div>
            {isExpanded && <div>{renderNodes(node.children, depth + 1)}</div>}
          </div>
        )
      }

      return (
        <div
          key={`${node.path}-${node.index}`}
          className="file-pill"
          style={{
            marginLeft: `${depth * INDENT_SIZE}px`,
            width: 'calc(100% - ' + depth * INDENT_SIZE + 'px)',
          }}
        >
          <div className="file-pill-icon">
            <Upload className="upload-tree-file-icon" />
          </div>

          <div className="file-pill-info">
            <div className="file-pill-name">{node.name}</div>
            <div className="file-pill-size">{formatFileSize(selectedFiles[node.index].size)}</div>
          </div>

          <button
            type="button"
            aria-label={`Remove ${node.name}`}
            className="file-pill-remove"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemoveFile(node.index)
            }}
            disabled={disabled}
          >
            <X className="upload-tree-action-icon" />
          </button>
        </div>
      )
    })
  }

  return (
    <div
      {...getRootProps()}
      className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        {...(getInputProps() as any)}
        webkitdirectory="true"
        directory="true"
      />

      {selectedFiles.length > 0 ? (
        <div style={{ textAlign: 'left' }}>
          {/* File pills */}
          <div
            className="upload-stack-scroll"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {renderNodes(treeNodes)}
          </div>

          {/* Add more files link */}
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            + Add more files
          </button>

          {/* Summary */}
          <p style={{
            fontSize: '12px',
            color: 'var(--ink3)',
            marginBottom: '8px',
          }}>
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} • {formatFileSize(totalSize)}
          </p>
        </div>
      ) : (
        <div>
          {/* Drop zone icon */}
          <div className="drop-zone-icon">
            <Upload />
          </div>

          {/* Drop zone title */}
          <h3 className="drop-zone-title">Drop your folder & files here</h3>

          {/* Drop zone subtitle */}
          <p className="drop-zone-subtitle">or click to browse</p>

          {/* Drop zone hint */}
          <div className="drop-zone-hint">
            <span>·</span>
            <span>Any format</span>
            <span>·</span>
          </div>
        </div>
      )}
    </div>
  )
}
