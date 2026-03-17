import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('health()', () => {
    it('returns ok: true with service name', () => {
      expect(controller.health()).toEqual({ ok: true, service: 'api' });
    });
  });

  describe('test()', () => {
    it('returns a message confirming the route is working', () => {
      const result = controller.test();
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });
  });
});
