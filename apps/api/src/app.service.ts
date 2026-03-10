// pdf.service.ts
import fs from 'fs';
import pdf from 'pdf-parse';

export class PdfService {
  async parseFromFile(filename: string) {
    const dataBuffer = fs.readFileSync(filename);
    const data = await pdf(dataBuffer);
    return data.text; // this is the plain text extracted
  }
}