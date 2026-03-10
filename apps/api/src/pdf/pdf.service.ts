import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

// pull the class from the module
const { PDFParse } = require('pdf-parse');

@Injectable()
export class PdfService {
  async parseFromFile(path: string): Promise<string> {
    const buffer = fs.readFileSync(path);

    // create a parser instance with the buffer
    const parser = new PDFParse({ data: buffer });

    // parse the PDF
    const result = await parser.parse();

    return result.text;
  }
}