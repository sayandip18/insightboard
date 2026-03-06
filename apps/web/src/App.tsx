import { Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { FileUpload } from './components/FileUpload'
import { JobQueue } from './components/JobQueue'
import { useJobQueue } from './hooks/useJobQueue'

function App() {
  const { jobs, addJob } = useJobQueue()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between !mb-1">
          <Typography variant="h4" className="!font-bold text-gray-800">
            InsightBoard
          </Typography>
          <Button size="small" variant="outlined" onClick={() => navigate('/visualize')}>
            Visualize
          </Button>
        </div>
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
