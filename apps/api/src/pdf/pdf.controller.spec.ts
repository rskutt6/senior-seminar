import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

describe('PdfController', () => {
  let controller: PdfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        {
          provide: PdfService,
          useValue: { parseFromFile: jest.fn().mockResolvedValue('mock text') },
        },
      ],
    }).compile();

    controller = module.get<PdfController>(PdfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
