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
    throw new Error("No JSON object found in model response.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("extract-assignment-details: OPENAI_API_KEY is missing");
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

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Extract assignment details from the text below.

Return ONLY valid JSON in exactly this shape:
{
  "title": "string | null",
  "courseName": "string | null",
  "dueAt": "string | null",
  "weight": number | null,
  "summaryHint": "string"
}

Rules:
- title: assignment title if clearly present, otherwise null
- courseName: course/class name if clearly present, otherwise null
- dueAt: use an ISO-style datetime string if clearly present, otherwise null
- if not ISO-style, find the month and day and convert into ISO-style
- if there is no time, you may use 23:59:00
- weight: numeric percent only, like 20 for 20%
- summaryHint: one short sentence
- do not include any explanation outside the JSON

Assignment description:
${description}`,
    });

    const rawText = response.output_text?.trim() || "";
    console.log("extract-assignment-details raw output:", rawText);

    if (!rawText) {
      return NextResponse.json(
        { error: "No extraction returned from OpenAI." },
        { status: 500 }
      );
    }

    let parsed: {
      title?: string | null;
      courseName?: string | null;
      dueAt?: string | null;
      weight?: number | null;
      summaryHint?: string;
    };

    try {
      const jsonText = extractJsonObject(rawText);
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse extraction JSON:", parseError);
      return NextResponse.json(
        {
          error: "Extraction returned invalid JSON.",
          raw: rawText,
        },
        { status: 500 }
      );
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
      dueAt:
        typeof parsed.dueAt === "string" && parsed.dueAt.trim()
          ? parsed.dueAt.trim()
          : null,
      weight:
        typeof parsed.weight === "number" && Number.isFinite(parsed.weight)
          ? parsed.weight
          : null,
      summaryHint:
        typeof parsed.summaryHint === "string" && parsed.summaryHint.trim()
          ? parsed.summaryHint.trim()
          : "Parsed assignment details.",
    });
  } catch (error) {
    console.error("extract-assignment-details route error:", error);
    return NextResponse.json(
      { error: "Failed to detect assignment details." },
      { status: 500 }
    );
  }
}