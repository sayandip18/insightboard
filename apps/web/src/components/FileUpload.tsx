import { useState, useRef } from "react";
import {
  Button,
  Typography,
  Paper,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

type Props = {
  onJobAdded: (jobId: string, filename: string, cached: boolean) => void;
};

export function FileUpload({ onJobAdded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // NOTE: the "force" state is only used to trigger the "force regenerate" behavior on the backend
  // This is for testing purpose only and should be removed in production to avoid confusion for end users
  const [force, setForce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped && dropped.type !== "text/plain") return;
    setFile(dropped);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const url = force ? `${base}/upload?force=true` : `${base}/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
      const data = await res.json();
      onJobAdded(data.jobId, file.name, data.cached ?? false);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="w-full">
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
            or click to browse — .txt files only
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

      {file && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          <InsertDriveFileIcon className="text-blue-400 shrink-0" />
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
        </div>
      )}

      {uploading && <LinearProgress className="!mt-3 !rounded-full" />}

      {error && (
        <Typography variant="caption" className="!mt-2 !block text-red-500">
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        className="!mt-4 !rounded-xl !py-3 !font-semibold !normal-case"
        startIcon={<UploadFileIcon />}
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading…" : "Upload File"}
      </Button>

      <FormControlLabel
        control={
          <Checkbox
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="caption" className="text-gray-500">
            Force regenerate (bypass cache)
          </Typography>
        }
        className="!mt-1"
      />
    </div>
  );
}
