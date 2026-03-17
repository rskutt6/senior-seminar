import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { message: 'OPENAI_API_KEY not set' },
        { status: 500 },
      );
    }

    const { description } = await req.json();
    if (!description || typeof description !== 'string') {
      return Response.json({ message: 'Missing description' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await openai.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      instructions: [
        'You help students understand assignments.',
        'Write a clear summary in 1–3 sentences.',
        'Explain the goal of the assignment and the main tasks the student must complete.',
        'Do not use bullet points or formatting.',
      ].join(' '),
      input: description,
    });

    const summary = resp.output_text?.trim() || '';
    return Response.json({ summary });
  } catch (err: any) {
    return Response.json(
      { message: err?.message || 'Summarization failed' },
      { status: 500 },
    );
  }
}