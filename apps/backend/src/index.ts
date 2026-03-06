import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";
import { generateTasksFromTranscript } from "./llm";

function hashTranscript(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const app = express();
const prisma = new PrismaClient();

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

  if (existing && existing.dependencyGraph) {
    res.status(200).json({
      id: existing.id,
      filename: existing.filename,
      createdAt: existing.createdAt,
      dependencyGraph: existing.dependencyGraph.graphData,
      cached: true,
    });
    return;
  }

  let transcript;
  try {
    transcript = await prisma.transcript.create({
      data: { filename, content, contentHash },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.transcript.findUnique({
        where: { contentHash },
        include: { dependencyGraph: true },
      });
      if (existing && existing.dependencyGraph) {
        res.status(200).json({
          id: existing.id,
          filename: existing.filename,
          createdAt: existing.createdAt,
          dependencyGraph: existing.dependencyGraph.graphData,
          cached: true,
        });
        return;
      }
    }
    throw err;
  }

  const tasks = await generateTasksFromTranscript(content);

  const dependencyGraph = await prisma.dependencyGraph.create({
    data: {
      transcriptId: transcript.id,
      graphData: tasks,
    },
  });

  res.status(201).json({
    id: transcript.id,
    filename: transcript.filename,
    createdAt: transcript.createdAt,
    dependencyGraph: dependencyGraph.graphData,
  });
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});
