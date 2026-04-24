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
    folderId,
  }: {
    text: string;
    userId: number;
    title: string;
    sourceType: SourceType;
    sourceName?: string;
    folderId?: number | null;
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

    if (folderId) {
      await this.ensureFolderBelongsToUser(folderId, userId);
    }

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

    await fs.writeFile(filePath, buffer);

    const result = await pool.query(
      `
      INSERT INTO "AudioReading"
      ("userId", title, "sourceType", "sourceName", "sourceText", "audioUrl", "folderId")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        "userId",
        title,
        "sourceType",
        "sourceName",
        "sourceText",
        "audioUrl",
        "folderId",
        "createdAt"
      `,
      [
        userId,
        safeTitle,
        sourceType,
        sourceName ?? null,
        cleaned,
        fileName,
        folderId ?? null,
      ],
    );

    return result.rows[0];
  }

  async getLibrary(userId: number) {
    const foldersResult = await pool.query(
      `
      SELECT
        id,
        name,
        "createdAt"
      FROM "AudioFolder"
      WHERE "userId" = $1
      ORDER BY LOWER(name) ASC, id ASC
      `,
      [userId],
    );

    const audioResult = await pool.query(
      `
      SELECT
        id,
        title,
        "sourceType",
        "sourceName",
        "folderId",
        "createdAt"
      FROM "AudioReading"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      `,
      [userId],
    );

    return {
      folders: foldersResult.rows,
      items: audioResult.rows,
    };
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
        "folderId",
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

    try {
      return await fs.readFile(filePath);
    } catch {
      throw new BadRequestException('Saved audio file could not be opened');
    }
  }

  async createFolder(userId: number, name: string) {
    const cleaned = name?.trim();

    if (!cleaned) {
      throw new BadRequestException('Folder name is required');
    }

    const result = await pool.query(
      `
      INSERT INTO "AudioFolder" ("userId", name)
      VALUES ($1, $2)
      RETURNING id, "userId", name, "createdAt"
      `,
      [userId, cleaned],
    );

    return result.rows[0];
  }

  async renameFolder(folderId: number, userId: number, name: string) {
    const cleaned = name?.trim();

    if (!cleaned) {
      throw new BadRequestException('Folder name is required');
    }

    const result = await pool.query(
      `
      UPDATE "AudioFolder"
      SET name = $3
      WHERE id = $1 AND "userId" = $2
      RETURNING id, "userId", name, "createdAt"
      `,
      [folderId, userId, cleaned],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Folder not found');
    }

    return result.rows[0];
  }

  async renameAudio(audioId: number, userId: number, title: string) {
    const cleaned = title?.trim();

    if (!cleaned) {
      throw new BadRequestException('Audio title is required');
    }

    const result = await pool.query(
      `
      UPDATE "AudioReading"
      SET title = $3
      WHERE id = $1 AND "userId" = $2
      RETURNING
        id,
        "userId",
        title,
        "sourceType",
        "sourceName",
        "sourceText",
        "audioUrl",
        "folderId",
        "createdAt"
      `,
      [audioId, userId, cleaned],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Audio not found');
    }

    return result.rows[0];
  }

  async moveAudio(audioId: number, userId: number, folderId: number | null) {
    if (folderId !== null) {
      await this.ensureFolderBelongsToUser(folderId, userId);
    }

    const result = await pool.query(
      `
      UPDATE "AudioReading"
      SET "folderId" = $3
      WHERE id = $1 AND "userId" = $2
      RETURNING
        id,
        "userId",
        title,
        "sourceType",
        "sourceName",
        "sourceText",
        "audioUrl",
        "folderId",
        "createdAt"
      `,
      [audioId, userId, folderId],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Audio not found');
    }

    return result.rows[0];
  }

  private async ensureFolderBelongsToUser(folderId: number, userId: number) {
    const result = await pool.query(
      `
      SELECT id
      FROM "AudioFolder"
      WHERE id = $1 AND "userId" = $2
      LIMIT 1
      `,
      [folderId, userId],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Folder not found');
    }
  }

  async deleteAudio(audioId: number, userId: number) {
    const item = await this.getAudioById(audioId, userId);

    if (!item) {
      throw new BadRequestException('Audio not found');
    }

    await pool.query(
      `
      DELETE FROM "AudioReading"
      WHERE id = $1 AND "userId" = $2
      `,
      [audioId, userId],
    );

    try {
      const filePath = path.join(this.uploadDir, item.audioUrl);
      await fs.unlink(filePath);
    } catch {
      // If the file is already missing, still allow DB delete to succeed.
    }

    return true;
  }
}