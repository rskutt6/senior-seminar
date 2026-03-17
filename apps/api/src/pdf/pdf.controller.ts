import { Controller, Get } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('test')
  async test() {
    // adjust path to any PDF in your repo for now
    const text = await this.pdfService.parseFromFile('sample.pdf');
    return { text };
  }
}