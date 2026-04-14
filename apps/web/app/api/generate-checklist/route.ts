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
    throw new Error("No JSON object found");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function POST(req: Request) {
  try {
    const { title, description, dueAt } = await req.json();

    const prompt = `
You are helping a student plan an assignment.

Return ONLY valid JSON:

{
  "overview": "string",
  "checklist": [
    {
      "step": "string",
      "minutes": number,
      "dueDate": "YYYY-MM-DD"
    }
  ]
}

Rules:
- Break into 5–9 realistic steps
- Each step must include a dueDate
- Spread steps between today and assignment due date
- Earlier steps sooner
- Dates must feel natural (not evenly spaced)
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Return only JSON." },
        {
          role: "user",
          content: `${title}\n\n${description}\n\nDue: ${dueAt}\n\n${prompt}`,
        },
      ],
      temperature: 0.3,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJsonObject(rawText));

    return NextResponse.json({
      overview: parsed.overview ?? "",
      checklist: parsed.checklist ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Checklist failed" }, { status: 500 });
  }
}