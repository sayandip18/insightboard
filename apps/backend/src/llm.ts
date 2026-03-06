import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateTasks, sanitizeDependencies, resolveCycles } from "./utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateTasksFromTranscript(transcript: string) {
  const prompt = `
    Convert the meeting transcript into a comprehensive task dependency graph.

    Rules:
    1. Identify all technical tasks, sub-tasks, and legacy maintenance mentioned.
    2. Define a "Final Milestone" task (e.g., Launch/Release) if implied, which depends on all critical path tasks.
    3. Map dependencies even if they are implicit (e.g., if a Dev says "I need X fixed before I can test Y," Y depends on X).
    4. Extract priority based on speaker urgency (P0/Showstopper = high).

    Return ONLY valid JSON:
    [
      {
        "id": "string",
        "description": "string",
        "priority": "low | medium | high",
        "dependencies": ["taskId"]
      }
    ]

    Transcript:
    ${transcript}
  `;

  const result = await model.generateContent(prompt);

  const text = result.response
    .text()
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/```$/m, "")
    .trim();

  return resolveCycles(sanitizeDependencies(validateTasks(JSON.parse(text))));
}
