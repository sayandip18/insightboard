import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";

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

  const transcript = await prisma.transcript.create({
    data: { filename, content },
  });

  res
    .status(201)
    .json({
      id: transcript.id,
      filename: transcript.filename,
      createdAt: transcript.createdAt,
    });
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});
