import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------- helper to safely extract JSON ---------- */
function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

/* ---------- ROUTE ---------- */
export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    if (!description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing description" }),
        { status: 400 }
      );
    }

    const prompt = `
You are analyzing a college assignment.

Return ONLY valid JSON in this exact format:

{
  "summary": {
    "focus": "Main goal of the assignment",
    "content": "What topics/content must be covered",
    "sources": "Source or research requirements",
    "structure": "How the assignment should be structured",
    "formatting": "Formatting + submission details"
  },
  "assignmentType": "homework | essay | reading | project | discussion | exam | quiz | lab | presentation | other",
  "priority": "high | medium | low",
  "status": "not_started",
  "problemCount": number or null,
  "pageCount": number or null
}

Rules:
- Keep each summary field 1–2 sentences max
- priority = HIGH if soon or heavy workload
- status ALWAYS = "not_started"
- Detect page count if "X pages"
- Detect problem count if "X problems"
- assignmentType should be best guess

Assignment:
${title || ""}

${description}
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const rawText = response.output_text || "";

    let parsed;

    try {
      parsed = JSON.parse(extractJsonObject(rawText));
    } catch (err) {
      console.error("JSON parse failed:", rawText);

      return new Response(
        JSON.stringify({
          summary: null,
          assignmentType: null,
          priority: "medium",
          status: "not_started",
          problemCount: null,
          pageCount: null,
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify(parsed), { status: 200 });
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({
        summary: null,
        assignmentType: null,
        priority: "medium",
        status: "not_started",
        problemCount: null,
        pageCount: null,
      }),
      { status: 500 }
    );
  }
}