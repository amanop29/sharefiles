'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ChevronDown, ChevronRight, File as FileIcon, Folder, Trash2, Upload, X } from 'lucide-react'
import clsx from 'clsx'
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

export function UploadBox({ onFileSelect, onRemoveFile, onRemoveFolder, disabled, selectedFiles }: UploadBoxProps) {
  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const treeNodes = useMemo(() => buildTree(selectedFiles), [selectedFiles])

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
          <div key={node.path} className="space-y-1">
            <div
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-800/70"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <button
                type="button"
                className="min-w-0 flex-1 flex items-center gap-1.5 text-left"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFolder(node.path)
                }}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Folder className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{node.name}</span>
              </button>
              <button
                type="button"
                aria-label={`Remove folder ${node.name}`}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemoveFolder(node.path)
                }}
                disabled={disabled}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {isExpanded && <div>{renderNodes(node.children, depth + 1)}</div>}
          </div>
        )
      }

      return (
        <div
          key={`${node.path}-${node.index}`}
          className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-gray-100/70 dark:bg-gray-900/60"
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <FileIcon className="w-3.5 h-3.5 text-gray-500" />
            <p className="truncate text-left">{node.name}</p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${node.name}`}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemoveFile(node.index)
            }}
            disabled={disabled}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    })
  }

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        {...getInputProps({
          // Allow selecting full folders from the file picker in addition to drag/drop folders.
          ...( { webkitdirectory: '' } as unknown as Record<string, string> ),
          ...( { directory: '' } as unknown as Record<string, string> ),
        })}
      />
      
      {selectedFiles.length > 0 ? (
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-50">
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(totalSize)} total
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 max-h-48 overflow-y-auto">
            {renderNodes(treeNodes)}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Same-name files are auto-renamed internally as (2), (3), ...
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Drag a folder or click to add files/folders</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Drag & drop files or a folder here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse files/folders</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Max 100MB per file • Add files in multiple steps</p>
        </div>
      )}
    </div>
  )
}
