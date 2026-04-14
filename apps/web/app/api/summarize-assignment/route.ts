import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    const prompt = `
Analyze this assignment and return JSON:

{
  "summary": "bullet points",
  "assignmentType": "Homework | Exam | Quiz | Project | Essay | Other",
  "priority": "high | medium | low",
  "status": "not_started | in_progress | completed",
  "problemCount": number | null,
  "pageCount": number | null
}

Rules:
- priority = high if soon or heavy
- status = always "not_started"
- detect pages/problems if mentioned
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `${title}\n\n${description}\n\n${prompt}`,
    });

    const parsed = JSON.parse(response.output_text || "{}");

    return new Response(
      JSON.stringify(parsed),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed" }),
      { status: 500 }
    );
  }
}