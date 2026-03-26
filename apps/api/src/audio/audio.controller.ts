import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AudioService } from './audio.service';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('text-to-speech')
  async textToSpeech(
    @Body('text') text: string,
    @Res() res: Response,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException('Text is required');
    }

    const audioBuffer = await this.audioService.textToSpeech(text);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });

    res.send(audioBuffer);
  }
}