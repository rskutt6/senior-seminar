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
      input: `Generate a detailed, actionable checklist for this assignment.

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
- Each step must be SPECIFIC and ACTIONABLE (no vague steps like "work on assignment")
- Break large tasks into smaller steps (5–10 steps total)
- Include concrete actions like:
  - "Review lecture slides for chapters 1–3"
  - "Take notes on key concepts from chapter 4"
  - "Create outline with intro, 3 body sections, conclusion"
- Vary step types (reading, notes, planning, writing, reviewing)
- Include at least one "review" or "final check" step at the end
- minutes should be realistic (30–120 per step)
- priorityScore: 1–100 (higher = more important)
- prioritize:
  - exams/projects > essays > homework
  - closer deadlines
  - dependency order
- distribute scores (not all 100)

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