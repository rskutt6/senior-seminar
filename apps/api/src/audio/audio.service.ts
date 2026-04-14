import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AudioService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async textToSpeech(text: string): Promise<Buffer> {
    const cleaned = text?.trim();

    if (!cleaned) {
      throw new BadRequestException('Text is required');
    }

    // OpenAI speech input is currently limited to 4096 characters.
    if (cleaned.length > 4096) {
      throw new BadRequestException(
        'Text is too long. Please keep it under 4096 characters for now.',
      );
    }

    const mp3 = await this.openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'marin',
      input: cleaned,
      instructions: 'Speak clearly, warmly, and accessibly.',
      response_format: 'mp3',
    });

    return Buffer.from(await mp3.arrayBuffer());
  }
}