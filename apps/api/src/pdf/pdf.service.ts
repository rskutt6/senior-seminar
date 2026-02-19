import { Injectable } from '@nestjs/common';
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfService {
  async processPdf(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('No file uploaded or file is empty');
    }

    const data = await pdfParse(file.buffer);
    return { text: data.text.slice(0, 2000) };
  }
}