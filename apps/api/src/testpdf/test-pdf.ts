import { PdfService } from '../pdf/pdf.service';

async function run() {
  const service = new PdfService();
  const text = await service.parseFromFile('./sample.pdf');
  console.log(text.slice(0, 500));
}

run();