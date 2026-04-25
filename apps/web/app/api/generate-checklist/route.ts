import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Generate a checklist for this assignment.

Return ONLY valid JSON:
{
  "overview": "string",
  "checklist": [
    {
      "step": "string",
      "minutes": number,
      "priorityScore": number
    }
  ]
}

Rules:
- priorityScore: 1–100 (higher = more important)
- prioritize:
  - exams/projects > essays > homework
  - closer deadlines
  - dependency order
- distribute scores (not all 100)
- steps must be actionable

Text:
${description}`,
    });

    const text = response.output_text;

    const parsed = JSON.parse(text);

    return Response.json({
      overview: parsed.overview,
      checklist: parsed.checklist.map((item: any) => ({
        id: makeId(),
        step: item.step,
        minutes: item.minutes,
        dueDate: "",
        checked: false,
        priorityScore: item.priorityScore ?? 50,
      })),
    });
  } catch (err) {
    return new Response("Failed", { status: 500 });
  }
}