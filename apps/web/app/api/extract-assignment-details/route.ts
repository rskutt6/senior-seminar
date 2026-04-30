import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const description =
      typeof body?.description === "string" ? body.description.trim() : "";

    const classes = Array.isArray(body?.classes)
      ? body.classes.map((c: unknown) => String(c).trim()).filter(Boolean)
      : [];

    const assignmentTypes = Array.isArray(body?.assignmentTypes)
      ? body.assignmentTypes.map((c: unknown) => String(c).trim()).filter(Boolean)
      : [];

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Extract assignment details.

Return ONLY valid JSON:
{
  "title": "string | null",
  "courseName": "string | null",
  "dueAt": "ISO 8601 date string with year (YYYY-MM-DDTHH:mm:ss.sssZ) or null",
  "weight": number | null,
  "assignmentType": "string",
  "problemCount": number | null,
  "pageCount": number | null,
  "priority": "string",
  "status": "string",
  "notes": "string | null",
  "summary": {
    "focus": "Main goal of the assignment",
    "content": "What you need to do",
    "sources": "Any research or sources needed",
    "structure": "How it should be organized",
    "formatting": "Formatting or submission requirements"
  }
}

Rules:
- dueAt MUST include a year (use current year if missing)
- If date is like "May 6" → convert to "2026-05-06T23:59:00.000Z"
- If no time is given → default to 11:59 PM
- NEVER return a past year
- assignmentType MUST be one of:
  homework, essay, reading, project, discussion, exam, quiz, lab, presentation, other
- If unsure → default to "homework"
- priority: high, medium, low
- status ALWAYS = "not_started"

Text:
${description}`
    });

    const raw = response.output_text?.trim() || "";
    const parsed = JSON.parse(extractJsonObject(raw));

    let dueAt: string | null = null;

if (typeof parsed.dueAt === "string" && parsed.dueAt.trim()) {
  const d = new Date(parsed.dueAt);

  if (!Number.isNaN(d.getTime())) {
    // 🔥 FORCE LOCAL 11:59 PM
    d.setHours(23, 59, 0, 0);

    dueAt = d.toISOString();
  }
}
    return NextResponse.json({
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : null,
      courseName:
        typeof parsed.courseName === "string" && parsed.courseName.trim()
          ? parsed.courseName.trim()
          : null,
      dueAt: dueAt,
      weight:
        typeof parsed.weight === "number" && Number.isFinite(parsed.weight)
          ? parsed.weight
          : null,
      assignmentType:
        typeof parsed.assignmentType === "string" && parsed.assignmentType.trim()
          ? parsed.assignmentType.trim().toLowerCase()
          : null,
      problemCount:
        typeof parsed.problemCount === "number" && Number.isFinite(parsed.problemCount)
          ? parsed.problemCount
          : null,
      pageCount:
        typeof parsed.pageCount === "number" && Number.isFinite(parsed.pageCount)
          ? parsed.pageCount
          : null,
      priority:
        typeof parsed.priority === "string" && parsed.priority.trim()
          ? parsed.priority.trim().toLowerCase()
          : null,
      status:
        typeof parsed.status === "string" && parsed.status.trim()
          ? parsed.status.trim().toLowerCase()
          : "not_started",
      notes:
        typeof parsed.notes === "string" && parsed.notes.trim()
          ? parsed.notes.trim()
          : null,
      summary:
        typeof parsed.summary === "object" && parsed.summary !== null
          ? parsed.summary
          : null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}