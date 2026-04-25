import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
    @Body('folderId') folderId?: number,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException('Text is required');
    }

    const item = await this.audioService.textToSpeechAndSave({
      text,
      title: title?.trim() || 'Untitled audio',
      sourceType: sourceType || 'text',
      sourceName,
      folderId: folderId ?? null,
      userId: this.getCurrentUserId(),
    });

    return {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      folderId: item.folderId,
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
    const item = await this.audioService.getAudioById(
      Number(id),
      this.getCurrentUserId(),
    );

    if (!item) {
      throw new BadRequestException('Audio not found');
    }

    return {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      sourceText: item.sourceText,
      folderId: item.folderId,
      createdAt: item.createdAt,
      audioUrl: `http://localhost:4000/audio/${item.id}/stream`,
    };
  }

  @Get(':id/stream')
  async streamAudio(@Param('id') id: string, @Res() res: Response) {
    const item = await this.audioService.getAudioById(
      Number(id),
      this.getCurrentUserId(),
    );

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

  @Post('folders')
  async createFolder(@Body('name') name: string) {
    return this.audioService.createFolder(this.getCurrentUserId(), name);
  }

  @Patch('folders/:id')
  async renameFolder(
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.audioService.renameFolder(
      Number(id),
      this.getCurrentUserId(),
      name,
    );
  }

  @Patch(':id/rename')
  async renameAudio(
    @Param('id') id: string,
    @Body('title') title: string,
  ) {
    return this.audioService.renameAudio(
      Number(id),
      this.getCurrentUserId(),
      title,
    );
  }

  @Patch(':id/move')
  async moveAudio(
    @Param('id') id: string,
    @Body('folderId') folderId: number | null,
  ) {
    return this.audioService.moveAudio(
      Number(id),
      this.getCurrentUserId(),
      folderId ?? null,
    );
  }

  @Delete(':id')
  async deleteAudio(@Param('id') id: string) {
    await this.audioService.deleteAudio(
      Number(id),
      this.getCurrentUserId(),
    );

    return { success: true };
  }
}