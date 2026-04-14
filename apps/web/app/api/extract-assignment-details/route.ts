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
  "dueAt": "string | null",
  "weight": number | null,
  "assignmentType": "string | null",
  "problemCount": number | null",
  "pageCount": number | null,
  "priority": "string | null",
  "status": "string | null",
  "notes": "string | null",
  "summary": "string | null"
}

Rules:
- courseName MUST match the closest existing class from this list when possible:
${classes.length ? classes.join(", ") : "none"}

- assignmentType MUST be one of:
homework, essay, reading, project, discussion, exam, quiz, lab, presentation, other

Rules:
- Choose the BEST match based on description
- If unsure → default to "homework"
- NEVER return null

- dueAt:
  - return ISO datetime if found
  - understand dates like April 1, Apr 1, 4/1, 4/1/26
  - if no time, use 23:59:00

- priority:
  - high if urgent, heavy, or important
  - medium for normal assignments
  - low for smaller/lighter work

- status:
  - default to "not_started"

- problemCount if clearly stated
- pageCount if clearly stated
- notes should be short extra details if useful, otherwise null
- summary should be one short sentence

Text:
${description}`,
    });

    const raw = response.output_text?.trim() || "";
    const parsed = JSON.parse(extractJsonObject(raw));

    return NextResponse.json({
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : null,
      courseName:
        typeof parsed.courseName === "string" && parsed.courseName.trim()
          ? parsed.courseName.trim()
          : null,
      dueAt:
        typeof parsed.dueAt === "string" && parsed.dueAt.trim()
          ? parsed.dueAt.trim()
          : null,
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
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}