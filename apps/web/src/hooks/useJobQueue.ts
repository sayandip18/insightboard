import { useState, useEffect, useCallback, useRef } from 'react'
import { deduplicateBy } from '../utils'

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type JobEntry = {
  jobId: string
  filename: string
  status: JobStatus
  cached?: boolean
  error?: string
}

const STORAGE_KEY = 'insightboard_jobs'
const POLL_INTERVAL = 3000

function loadJobs(): JobEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useJobQueue() {
  const [jobs, setJobs] = useState<JobEntry[]>(loadJobs)
  const jobsRef = useRef(jobs)

  useEffect(() => {
    jobsRef.current = jobs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  }, [jobs])

  const addJob = useCallback((jobId: string, filename: string, cached = false) => {
    setJobs(prev =>
      deduplicateBy(
        [{ jobId, filename, status: cached ? 'COMPLETED' : 'PENDING', cached }, ...prev],
        'filename'
      )
    )
  }, [])

  const updateJob = useCallback((jobId: string, updates: Partial<JobEntry>) => {
    setJobs(prev => prev.map(j => (j.jobId === jobId ? { ...j, ...updates } : j)))
  }, [])

  useEffect(() => {
    const poll = async () => {
      const active = jobsRef.current.filter(
        j => j.status === 'PENDING' || j.status === 'PROCESSING'
      )
      if (active.length === 0) return

      await Promise.all(
        active.map(async job => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/jobs/${job.jobId}`)
            const data = await res.json()
            if (data.status !== job.status) {
              updateJob(job.jobId, { status: data.status, error: data.error })
            }
          } catch {
            // network error, skip
          }
        })
      )
    }

    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [updateJob])

  return { jobs, addJob }
}
