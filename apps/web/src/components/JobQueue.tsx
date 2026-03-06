import { Chip, Typography, Paper } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import type { JobEntry } from '../hooks/useJobQueue'

function StatusChip({ status }: { status: JobEntry['status'] }) {
  switch (status) {
    case 'PENDING':
      return <Chip icon={<HourglassEmptyIcon />} label="Queued" size="small" />
    case 'PROCESSING':
      return <Chip icon={<SyncIcon />} label="Processing" color="info" size="small" />
    case 'COMPLETED':
      return <Chip icon={<CheckCircleIcon />} label="Done" color="success" size="small" />
    case 'FAILED':
      return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
  }
}

export function JobQueue({ jobs }: { jobs: JobEntry[] }) {
  if (jobs.length === 0) return null

  return (
    <div className="mt-8 w-full">
      <Typography variant="subtitle1" className="!font-semibold !mb-3 text-gray-700">
        Recent Jobs
      </Typography>
      <div className="flex flex-col gap-2">
        {jobs.map(job => (
          <Paper
            key={job.jobId}
            variant="outlined"
            className="!rounded-xl !px-4 !py-3 flex items-center gap-3"
          >
            <InsertDriveFileIcon className="text-gray-400 shrink-0" />
            <Typography
              variant="body2"
              className="flex-1 !font-medium text-gray-700 truncate"
              title={job.filename}
            >
              {job.filename}
            </Typography>
            {job.cached && (
              <Chip label="Cached" size="small" variant="outlined" className="!text-xs shrink-0" />
            )}
            <div className="shrink-0">
              <StatusChip status={job.status} />
            </div>
          </Paper>
        ))}
      </div>
    </div>
  )
}
