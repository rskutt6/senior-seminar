import { NextResponse } from "next/server";
import OpenAI from "openai";

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
    const body = await req.json();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";

    if (!description) {
      return NextResponse.json(
        { error: "Assignment description is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are helping a student turn an assignment into a practical checklist.

Return ONLY valid JSON in exactly this shape:
{
  "overview": "string",
  "totalMinutes": number,
  "checklist": [
    {
      "step": "string",
      "minutes": number
    }
  ]
}

Rules:
- Make the checklist realistic and useful for a student.
- Break the work into clear, actionable steps.
- Keep each step concise.
- Give each step an estimated number of minutes.
- totalMinutes must equal the sum of all checklist item minutes.
- Do not include any text outside the JSON.
- Use the assignment title and description to infer the work.
- If the assignment is large, include planning, research, drafting, revision, debugging, or testing steps as needed.
- Prefer 5 to 9 checklist items.

Assignment title:
${title || "Untitled Assignment"}

Assignment description:
${description}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You convert assignment descriptions into structured checklist JSON with time estimates.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No checklist returned from OpenAI." },
        { status: 500 }
      );
    }

    let parsed: any;

    try {
      const jsonText = extractJsonObject(rawText);
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("Checklist parse error. Raw response:", rawText);
      return NextResponse.json(
        {
          error: "Checklist route returned invalid JSON.",
          raw: rawText,
        },
        { status: 500 }
      );
    }

    const checklist = Array.isArray(parsed?.checklist)
      ? parsed.checklist.map((item: any) => ({
          step: String(item?.step ?? "").trim(),
          minutes: Number(item?.minutes ?? 0),
        }))
      : [];

    const cleanedChecklist = checklist.filter(
      (item: { step: string; minutes: number }) =>
        item.step.length > 0 && Number.isFinite(item.minutes) && item.minutes > 0
    );

    const totalMinutes =
      typeof parsed?.totalMinutes === "number" && Number.isFinite(parsed.totalMinutes)
        ? parsed.totalMinutes
        : cleanedChecklist.reduce(
            (sum: number, item: { minutes: number }) => sum + item.minutes,
            0
          );

    return NextResponse.json({
      overview:
        typeof parsed?.overview === "string" && parsed.overview.trim()
          ? parsed.overview.trim()
          : "This assignment can be completed by breaking it into smaller steps.",
      totalMinutes,
      checklist: cleanedChecklist,
    });
  } catch (error) {
    console.error("generate-checklist route error:", error);
    return NextResponse.json(
      { error: "Failed to generate checklist." },
      { status: 500 }
    );
  }
}