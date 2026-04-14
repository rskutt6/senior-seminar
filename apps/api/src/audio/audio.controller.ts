import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AudioService } from './audio.service';

type SourceType = 'pdf' | 'text';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  private getCurrentUserId(): number {
    return 1;
  }

  @Post('text-to-speech')
  async textToSpeech(
    @Body('text') text: string,
    @Body('title') title: string,
    @Body('sourceType') sourceType: SourceType,
    @Body('sourceName') sourceName: string,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException('Text is required');
    }

    const item = await this.audioService.textToSpeechAndSave({
      text,
      title: title?.trim() || 'Untitled audio',
      sourceType: sourceType || 'text',
      sourceName,
      userId: this.getCurrentUserId(),
    });

    return {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      createdAt: item.createdAt,
      audioUrl: `http://localhost:4000/audio/${item.id}/stream`,
    };
  }

  @Get('library')
  async getLibrary() {
    return this.audioService.getLibrary(this.getCurrentUserId());
  }

  @Get('library/:id')
  async getLibraryItem(@Param('id') id: string) {
    console.log('Requested audio id:', id);
    console.log('Current user id:', this.getCurrentUserId());

    const item = await this.audioService.getAudioById(
      Number(id),
      this.getCurrentUserId(),
    );

    console.log('Fetched item:', item);

    if (!item) {
      throw new BadRequestException('Audio not found');
    }

    return {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      sourceText: item.sourceText,
      createdAt: item.createdAt,
      audioUrl: `http://localhost:4000/audio/${item.id}/stream`,
    };
  }

  @Get(':id/stream')
  async streamAudio(@Param('id') id: string, @Res() res: Response) {
    console.log('Streaming audio id:', id);
    console.log('Current user id:', this.getCurrentUserId());

    const item = await this.audioService.getAudioById(
      Number(id),
      this.getCurrentUserId(),
    );

    console.log('Streaming item:', item);

    if (!item) {
      throw new BadRequestException('Audio not found');
    }

    const buffer = await this.audioService.readAudioFile(item.audioUrl);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Content-Disposition': `inline; filename="audio-${item.id}.mp3"`,
    });

    res.send(buffer);
  }
}