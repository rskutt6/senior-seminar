import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  // Keep the old test endpoint so nothing breaks
  @Get('test')
  async test() {
    const text = await this.pdfService.parseFromFile('sample.pdf');
    return { text };
  }

  // New upload endpoint — receives a PDF, returns its text
  @Post('extract-text')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // keep file in memory, no disk writes
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    }),
  )
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const text = await this.pdfService.parseFromBuffer(file.buffer);
    return { text };
  }
}
