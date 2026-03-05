import { useState, useRef } from 'react'
import {
  Button,
  Typography,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setUploaded(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0] ?? null
    if (dropped && dropped.type !== 'text/plain') return
    setFile(dropped)
    setUploaded(false)
  }

  const handleUpload = () => {
    if (!file) return
    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      setUploading(false)
      setUploaded(true)
    }, 1500)
  }

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div className="w-full max-w-lg">
      <Typography variant="h4" className="!font-bold !mb-1 text-gray-800">
        InsightBoard
      </Typography>
      <Typography variant="body1" className="!mb-6 text-gray-500">
        Upload a file to get started with your analysis.
      </Typography>

      {/* Drop zone */}
      <Paper
        variant="outlined"
        className="!rounded-2xl !border-2 !border-dashed !border-blue-300 !bg-blue-50 cursor-pointer hover:!bg-blue-100 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <UploadFileIcon className="!text-blue-400 !text-5xl !mb-3" />
          <Typography variant="h6" className="!font-semibold text-blue-600">
            Drag &amp; drop your file here
          </Typography>
          <Typography variant="body2" className="text-gray-400 !mt-1">
            or click to browse
          </Typography>
        </div>
      </Paper>

      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Selected file info */}
      {file && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          <InsertDriveFileIcon className="text-blue-400" />
          <div className="flex-1 min-w-0">
            <Typography
              variant="body2"
              className="!font-medium text-gray-700 truncate"
            >
              {file.name}
            </Typography>
            <Typography variant="caption" className="text-gray-400">
              {formatSize(file.size)}
            </Typography>
          </div>
          {uploaded && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Uploaded"
              color="success"
              size="small"
            />
          )}
        </div>
      )}

      {/* Progress bar */}
      {uploading && <LinearProgress className="!mt-3 !rounded-full" />}

      {/* Upload button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        className="!mt-4 !rounded-xl !py-3 !font-semibold !normal-case"
        startIcon={<UploadFileIcon />}
        onClick={handleUpload}
        disabled={!file || uploading || uploaded}
      >
        {uploading ? 'Uploading…' : uploaded ? 'Uploaded' : 'Upload File'}
      </Button>
    </div>
  )
}
