import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfService {
  async parseFromFile(path: string): Promise<string> {
    const buffer = fs.readFileSync(path);
    const result = await pdfParse(buffer);
    return result.text;
  }

  async parseFromBuffer(buffer: Buffer): Promise<string> {
    const result = await pdfParse(buffer);
    return result.text;
  }
}
