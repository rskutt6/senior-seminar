jest.mock('fs', () => ({ readFileSync: jest.fn() }));
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockResolvedValue({ text: 'mocked pdf text' }),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import * as fs from 'fs';

const mockReadFileSync = fs.readFileSync as jest.Mock;

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();
    service = module.get<PdfService>(PdfService);
    jest.clearAllMocks();
  });

  describe('parseFromFile', () => {
    it('returns extracted text from a PDF', async () => {
      mockReadFileSync.mockReturnValueOnce(Buffer.from('fake'));
      const result = await service.parseFromFile('test.pdf');
      expect(result).toBe('mocked pdf text');
    });

    it('reads the file at the given path', async () => {
      mockReadFileSync.mockReturnValueOnce(Buffer.from('fake'));
      await service.parseFromFile('/some/path/doc.pdf');
      expect(mockReadFileSync).toHaveBeenCalledWith('/some/path/doc.pdf');
    });

    it('throws when file is not found', async () => {
      mockReadFileSync.mockImplementationOnce(() => {
        throw new Error('ENOENT: no such file');
      });
      await expect(service.parseFromFile('missing.pdf')).rejects.toThrow('ENOENT');
    });
  });
});
