import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const { description, dueAt } = await req.json();

    const today = new Date().toISOString().slice(0, 10);
    const dueDate = dueAt
      ? new Date(dueAt).toISOString().slice(0, 10)
      : today;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Generate a detailed, actionable checklist for this assignment.

Today is ${today}.
The assignment is due on ${dueDate}.

Return ONLY valid JSON:
{
  "overview": "string",
  "checklist": [
    {
      "step": "string",
      "minutes": number,
      "dueDate": "YYYY-MM-DD",
      "priorityScore": number
    }
  ]
}

Rules:
- Each step must be specific and actionable.

- You are scheduling WORK, not evenly spacing tasks.

- Distribute tasks based on:
  • effort (minutes)
  • priorityScore
  • logical dependencies

- HARDER / HIGHER PRIORITY tasks should be scheduled EARLIER
- Lighter tasks can be closer to the due date
- Final review MUST be near the due date

- Tasks should NOT be evenly distributed
- Some days can have 0 tasks
- Some days can have multiple tasks
- Group smaller tasks together if it makes sense

- dueDate MUST be between today (${today}) and due date (${dueDate})
- NEVER use past dates

- Think like a student planning their workload realistically

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
        dueDate: item.dueDate || today,
        checked: false,
        priorityScore: item.priorityScore ?? 50,
      })),
    });
  } catch (err: any) {
    console.error("CHECKLIST ERROR:", err);
    return new Response(err.message || "Failed", { status: 500 });
  }
}