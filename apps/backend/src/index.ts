import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { generateTasksFromTranscript } from "./llm";

function hashTranscript(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt files are allowed"));
    }
  },
});

async function processJob(
  jobId: string,
  transcriptId: string,
  content: string,
) {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });
  try {
    const tasks = await generateTasksFromTranscript(content);
    await prisma.dependencyGraph.create({
      data: { transcriptId, graphData: tasks },
    });
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });
  } catch (err) {
    console.error(`Error processing job ${jobId}:`, err);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "FAILED", error: String(err) },
    });
  }
}

// On startup, mark any stuck PROCESSING jobs as FAILED (crash recovery)
async function recoverStuckJobs() {
  const updated = await prisma.job.updateMany({
    where: { status: "PROCESSING" },
    data: {
      status: "FAILED",
      error: "Server restarted while job was processing",
    },
  });
  if (updated.count > 0) {
    console.log(`Recovered ${updated.count} stuck job(s) on startup`);
  }
}

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const content = req.file.buffer.toString("utf-8");
  const filename = req.file.originalname;
  const contentHash = hashTranscript(content);

  const existing = await prisma.transcript.findUnique({
    where: { contentHash },
    include: { dependencyGraph: true },
  });

  if (existing) {
    if (existing.dependencyGraph) {
      const job = await prisma.job.create({
        data: { transcriptId: existing.id, status: "COMPLETED" },
      });
      res.status(200).json({ jobId: job.id, cached: true });
      return;
    }
    const activeJob = await prisma.job.findFirst({
      where: { transcriptId: existing.id, status: { in: ["PENDING", "PROCESSING"] } },
    });
    if (activeJob) {
      res.status(200).json({ jobId: activeJob.id });
      return;
    }
  }

  let transcript;
  try {
    transcript = existing ?? await prisma.transcript.create({
      data: { filename, content, contentHash },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raceExisting = await prisma.transcript.findUnique({
        where: { contentHash },
        include: {
          dependencyGraph: true,
          jobs: {
            where: { status: { in: ["PENDING", "PROCESSING"] } },
            take: 1,
          },
        },
      });
      if (raceExisting?.dependencyGraph) {
        const job = await prisma.job.create({
          data: { transcriptId: raceExisting.id, status: "COMPLETED" },
        });
        res.status(200).json({ jobId: job.id, cached: true });
        return;
      }
      if (raceExisting?.jobs[0]) {
        res.status(200).json({ jobId: raceExisting.jobs[0].id });
        return;
      }
      transcript = raceExisting!;
    } else {
      throw err;
    }
  }

  const job = await prisma.job.create({
    data: { transcriptId: transcript.id, status: "PENDING" },
  });

  // Process the job async without blocking the main thread.
  processJob(job.id, transcript.id, content).catch(console.error);

  res.status(202).json({ jobId: job.id });
});

app.get("/jobs/completed", async (_req, res) => {
  const jobs = await prisma.job.findMany({
    where: { status: "COMPLETED" },
    include: { transcript: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    jobs.map((job) => ({
      jobId: job.id,
      filename: job.transcript!.filename,
      transcriptId: job.transcriptId,
      createdAt: job.createdAt,
    }))
  );
});

app.get("/jobs/:jobId/graph", async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.jobId },
    include: { transcript: { include: { dependencyGraph: true } } },
  });

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (job.status !== "COMPLETED" || !job.transcript?.dependencyGraph) {
    res.status(400).json({ error: "Graph not available" });
    return;
  }

  res.json(job.transcript.dependencyGraph.graphData);
});

app.get("/jobs/:jobId", async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.jobId },
    include: { transcript: { include: { dependencyGraph: true } } },
  });

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const response: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
  };

  if (job.status === "COMPLETED" && job.transcript?.dependencyGraph) {
    response.result = {
      transcriptId: job.transcriptId,
      filename: job.transcript.filename,
      dependencyGraph: job.transcript.dependencyGraph.graphData,
    };
  }

  if (job.status === "FAILED") {
    response.error = job.error;
  }

  res.json(response);
});

recoverStuckJobs().then(() => {
  app.listen(4000, () => {
    console.log("Backend running on port 4000");
  });
});
