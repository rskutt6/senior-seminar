import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import { pool } from '../db';
import * as fs from 'fs/promises';
import * as path from 'path';

type SourceType = 'pdf' | 'text';

@Injectable()
export class AudioService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  async textToSpeechAndSave({
    text,
    userId,
    title,
    sourceType,
    sourceName,
  }: {
    text: string;
    userId: number;
    title: string;
    sourceType: SourceType;
    sourceName?: string;
  }) {
    const cleaned = text?.trim();

    if (!cleaned) {
      throw new BadRequestException('Text is required');
    }

    if (cleaned.length > 4096) {
      throw new BadRequestException(
        'Text is too long. Please keep it under 4096 characters for now.',
      );
    }

    const safeTitle = title?.trim() || 'Untitled audio';

    const mp3 = await this.openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'marin',
      input: cleaned,
      instructions: 'Speak clearly, warmly, and accessibly.',
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    await fs.mkdir(this.uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
    const filePath = path.join(this.uploadDir, fileName);

    console.log('Saving audio file to:', filePath);

    await fs.writeFile(filePath, buffer);

    const result = await pool.query(
      `
      INSERT INTO "AudioReading"
      ("userId", title, "sourceType", "sourceName", "sourceText", "audioUrl")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        "userId",
        title,
        "sourceType",
        "sourceName",
        "sourceText",
        "audioUrl",
        "createdAt"
      `,
      [
        userId,
        safeTitle,
        sourceType,
        sourceName ?? null,
        cleaned,
        fileName,
      ],
    );

    return result.rows[0];
  }

  async getLibrary(userId: number) {
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        "sourceType",
        "sourceName",
        "createdAt"
      FROM "AudioReading"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async getAudioById(id: number, userId: number) {
    const result = await pool.query(
      `
      SELECT
        id,
        "userId",
        title,
        "sourceType",
        "sourceName",
        "sourceText",
        "audioUrl",
        "createdAt"
      FROM "AudioReading"
      WHERE id = $1 AND "userId" = $2
      LIMIT 1
      `,
      [id, userId],
    );

    return result.rows[0] ?? null;
  }

  async readAudioFile(fileName: string) {
    const filePath = path.join(this.uploadDir, fileName);
    console.log('Reading audio file from:', filePath);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to read audio file:', filePath, error);
      throw new BadRequestException('Saved audio file could not be opened');
    }
  }
}