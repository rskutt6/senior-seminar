import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const prompt = `
Extract assignment details.

Return ONLY valid JSON:

{
  "summary": "string",
  "type": "homework | exam | project | quiz | other",
  "priority": "high | medium | low",
  "status": "not_started | in_progress | completed",
  "problemCount": number | null,
  "pageCount": number | null,
  "notes": "string"
}

Rules:
- priority:
  - high → exams, big projects, near deadlines
  - medium → normal assignments
  - low → small tasks

- status:
  - default "not_started"

- type:
  - exam → test/midterm/final
  - project → long/multi-step
  - quiz → short
  - homework → normal
  - paper
  - lab
  - other → fallback
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `${title}\n\n${description}\n\n${prompt}`,
    });

    const text = response.output_text || "{}";

    const parsed = JSON.parse(text);

    return NextResponse.json({
      summary: parsed.summary ?? "",
      type: parsed.type ?? "homework",
      priority: parsed.priority ?? "medium",
      status: parsed.status ?? "not_started",
      problemCount: parsed.problemCount ?? null,
      pageCount: parsed.pageCount ?? null,
      notes: parsed.notes ?? "",
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}