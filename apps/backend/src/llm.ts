import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTasksFromTranscript(transcript: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `You convert meeting transcripts into tasks.
Return JSON only with the following schema:

[
 {
   "id": "string",
   "description": "string",
   "priority": "low | medium | high",
   "dependencies": ["taskId"]
 }
]`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  const content = response.choices[0].message.content;

  return JSON.parse(content!);
}
