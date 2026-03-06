import { Typography } from '@mui/material'
import { FileUpload } from './components/FileUpload'
import { JobQueue } from './components/JobQueue'
import { useJobQueue } from './hooks/useJobQueue'

function App() {
  const { jobs, addJob } = useJobQueue()

  return (
    <div className="min-h-screen w-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Typography variant="h4" className="!font-bold !mb-1 text-gray-800">
          InsightBoard
        </Typography>
        <Typography variant="body1" className="!mb-6 text-gray-500">
          Upload a transcript to generate a task dependency graph.
        </Typography>
        <FileUpload onJobAdded={addJob} />
        <JobQueue jobs={jobs} />
      </div>
    </div>
  )
}

export default App
