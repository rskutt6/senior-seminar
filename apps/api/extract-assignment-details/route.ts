import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";

    if (!description) {
      return NextResponse.json(
        { error: "Assignment description is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are extracting structured assignment details from a pasted assignment description.

Return ONLY valid JSON in exactly this shape:
{
  "title": "string | null",
  "courseName": "string | null",
  "dueAt": "ISO datetime string | null",
  "weight": number | null,
  "summaryHint": "string"
}

Rules:
- title: assignment title if clearly present, otherwise null
- courseName: class/course name if clearly present, otherwise null
- dueAt: convert to an ISO datetime string if a due date is clearly present
- If only a date is present and no time is given, use 23:59:00 local-style time in the ISO string
- weight: numeric percent only, like 20 for 20%
- summaryHint: one short sentence describing what was detected
- Do not guess wildly
- If unclear, return null
- Return JSON only

Assignment description:
${description}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You extract assignment metadata and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No extraction returned from OpenAI." },
        { status: 500 }
      );
    }

    let parsed: any;

    try {
      const jsonText = extractJsonObject(rawText);
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("Extraction parse error. Raw response:", rawText);
      return NextResponse.json(
        {
          error: "Extraction route returned invalid JSON.",
          raw: rawText,
        },
        { status: 500 }
      );
    }

    const title =
      typeof parsed?.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : null;

    const courseName =
      typeof parsed?.courseName === "string" && parsed.courseName.trim()
        ? parsed.courseName.trim()
        : null;

    const dueAt =
      typeof parsed?.dueAt === "string" && parsed.dueAt.trim()
        ? parsed.dueAt.trim()
        : null;

    const weight =
      typeof parsed?.weight === "number" && Number.isFinite(parsed.weight)
        ? parsed.weight
        : null;

    const summaryHint =
      typeof parsed?.summaryHint === "string" && parsed.summaryHint.trim()
        ? parsed.summaryHint.trim()
        : "Parsed assignment details.";

    return NextResponse.json({
      title,
      courseName,
      dueAt,
      weight,
      summaryHint,
    });
  } catch (error) {
    console.error("extract-assignment-details route error:", error);
    return NextResponse.json(
      { error: "Failed to extract assignment details." },
      { status: 500 }
    );
  }
}