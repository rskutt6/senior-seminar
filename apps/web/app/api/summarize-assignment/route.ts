import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    if (!description || !description.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing description" }),
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `You are summarizing a student assignment.

Return a clear, concise summary in 3-5 bullet points.

Assignment title: ${title || "Untitled Assignment"}

Assignment description:
${description}`,
    });

    return new Response(
      JSON.stringify({
        summary: response.output_text,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Summarize route error:", err);

    return new Response(
      JSON.stringify({ error: "Failed to summarize assignment" }),
      { status: 500 }
    );
  }
}