import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateTasks, sanitizeDependencies, resolveCycles } from "./utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function generateTasksFromTranscript(transcript: string) {
  const prompt = `
You convert meeting transcripts into tasks.

Return ONLY valid JSON with the following structure:

[
  {
    "id": "string",
    "description": "string",
    "priority": "low | medium | high",
    "dependencies": ["taskId"]
  }
]

Rules:
- IDs must be unique.
- dependencies must only reference existing task IDs.
- Do not include explanations.
- Output valid JSON only.

Transcript:
${transcript}
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text().replace(/^```(?:json)?\n?/m, "").replace(/```$/m, "").trim();

  return resolveCycles(sanitizeDependencies(validateTasks(JSON.parse(text))));
}
