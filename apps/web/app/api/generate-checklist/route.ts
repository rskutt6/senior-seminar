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

const jsonMatch = text.match(/\{[\s\S]*\}/);

if (!jsonMatch) {
  throw new Error("No JSON found in response");
}

const parsed = JSON.parse(jsonMatch[0]);

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
  } catch (err: any) {
  console.error("CHECKLIST ERROR:", err);
  return new Response(err.message || "Failed", { status: 500 });
}
}