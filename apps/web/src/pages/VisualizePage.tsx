import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { deduplicateBy } from "../utils";
import { Typography, Button, Paper, CircularProgress } from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { DependencyGraph } from "../components/DependencyGraph";

type CompletedJob = {
  jobId: string;
  filename: string;
  transcriptId: string;
  createdAt: string;
};

type Task = {
  id: string;
  description: string;
  priority: "low" | "medium" | "high";
  dependencies: string[];
  status?: string;
};

export function VisualizePage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{
    jobId: string;
    tasks: Task[];
  } | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadingGraph =
    selectedJobId !== null && graphData?.jobId !== selectedJobId;
  const tasks = graphData?.jobId === selectedJobId ? graphData.tasks : null;

  // TODO: replace useffects with react-query for better caching, loading, error handling
  // Fetch the list of all completed jobs once on mount to populate the left panel.
  useEffect(() => {
    fetch("http://localhost:4000/jobs/completed")
      .then((r) => r.json())
      .then((data) => setJobs(deduplicateBy(data, "transcriptId")))
      .finally(() => setLoadingJobs(false));
  }, []);

  // Whenever the selected job changes, fetch its dependency graph for the right panel.
  useEffect(() => {
    if (!selectedJobId) return;
    fetch(`http://localhost:4000/jobs/${selectedJobId}/graph`)
      .then((r) => r.json())
      .then((data) => {
        console.log(data);
        setGraphData({ jobId: selectedJobId, tasks: data });
      })
      .catch(() => setGraphData(null));
  }, [selectedJobId]);

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      {/* Left panel: job list */}
      <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <Typography
            variant="subtitle1"
            className="!font-semibold text-gray-800"
          >
            Completed Jobs
          </Typography>
          <Button size="small" variant="outlined" onClick={() => navigate("/")}>
            Upload
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingJobs ? (
            <div className="flex justify-center mt-8">
              <CircularProgress size={24} />
            </div>
          ) : jobs.length === 0 ? (
            <Typography
              variant="body2"
              className="text-gray-400 text-center mt-8"
            >
              No completed jobs yet.
            </Typography>
          ) : (
            <div className="flex flex-col gap-1">
              {jobs.map((job) => (
                <Paper
                  key={job.jobId}
                  variant="outlined"
                  onClick={() => setSelectedJobId(job.jobId)}
                  className="!rounded-lg !px-3 !py-2 flex items-center gap-2 cursor-pointer"
                  style={{
                    background:
                      selectedJobId === job.jobId ? "#eff6ff" : undefined,
                    borderColor:
                      selectedJobId === job.jobId ? "#3b82f6" : undefined,
                  }}
                >
                  <InsertDriveFileIcon
                    className="text-gray-400 shrink-0"
                    fontSize="small"
                  />
                  <Typography
                    variant="body2"
                    className="truncate text-gray-700 !font-medium"
                    title={job.filename}
                  >
                    {job.filename}
                  </Typography>
                </Paper>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: graph */}
      <div className="flex-1 relative">
        {!selectedJobId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Typography variant="body1">
              Select a job to view its dependency graph.
            </Typography>
          </div>
        ) : loadingGraph ? (
          <div className="flex items-center justify-center h-full">
            <CircularProgress />
          </div>
        ) : tasks ? (
          <DependencyGraph tasks={tasks} />
        ) : null}
      </div>
    </div>
  );
}
