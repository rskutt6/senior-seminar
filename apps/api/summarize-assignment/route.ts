import OpenAI from 'openai';

export const runtime = 'nodejs'; // important: OpenAI SDK needs Node runtime (not Edge)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string') {
      return Response.json({ message: 'Missing description' }, { status: 400 });
    }

    // Keep it short + deterministic-ish
    const resp = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content:
            'You summarize student assignment descriptions. Return 1 short sentence (max 18 words). No quotes, no bullet points.',
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.2,
    });

    // Pull text output
    const summary = resp.output_text?.trim() || 'Summary unavailable.';

    return Response.json({ summary });
  } catch (err: any) {
    return Response.json(
      { message: err?.message || 'Summarization failed' },
      { status: 500 },
    );
  }
}
