import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, description, dueAt } = await req.json();

    const prompt = `
Break this assignment into steps.

Return JSON:

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
- spread steps between today and due date
- earlier steps sooner
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `${title}\n\n${description}\n\nDue: ${dueAt}\n\n${prompt}`,
    });

    const text = response.output_text || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({
      overview: parsed.overview ?? "",
      checklist: parsed.checklist ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed checklist" }, { status: 500 });
  }
}