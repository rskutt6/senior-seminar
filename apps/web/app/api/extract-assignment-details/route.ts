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

    const description = body?.description?.trim() || "";
    const classes = Array.isArray(body?.classes) ? body.classes : [];

    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Extract assignment details.

Return ONLY JSON:
{
  "title": string | null,
  "courseName": string,
  "dueAt": string | null,
  "weight": number | null,
  "assignmentType": string | null,
  "problemCount": number | null,
  "pageCount": number | null,
  "summary": string
}

Rules:
- courseName MUST match closest from:
${classes.join(", ")}

- assignmentType = one of:
homework, essay, reading, project, discussion, exam, quiz, lab, presentation, other

- problemCount if "10 problems"
- pageCount if "5 pages"
- summary = 1 short sentence

Text:
${description}`,
    });

    const raw = response.output_text?.trim() || "";
    const parsed = JSON.parse(extractJsonObject(raw));

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}