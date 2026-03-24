import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PG_POOL } from '../db/db.module';

const mockPool = {
  query: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PG_POOL, useValue: mockPool },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  // ─── listForUser ──────────────────────────────────────────────────────────

  describe('listForUser', () => {
    it('returns courses for a valid userId', async () => {
      const rows = [
        { id: 1, name: 'COMP101', userId: 1 },
        { id: 2, name: 'MATH201', userId: 1 },
      ];
      mockPool.query.mockResolvedValueOnce({ rows });

      const result = await service.listForUser(1);
      expect(result).toEqual(rows);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('returns empty array when user has no courses', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.listForUser(42);
      expect(result).toEqual([]);
    });

    it('throws BadRequestException when userId is 0', async () => {
      await expect(service.listForUser(0)).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns a new course', async () => {
      const row = { id: 5, name: 'HIST301', userId: 1, createdAt: new Date() };
      // first query = check existing (none), second = insert
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row] });

      const result = await service.create(1, { name: 'HIST301' });
      expect(result).toEqual(row);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('returns existing course without inserting when duplicate', async () => {
      const existing = { id: 3, name: 'COMP101', userId: 1 };
      mockPool.query.mockResolvedValueOnce({ rows: [existing] });

      const result = await service.create(1, { name: 'COMP101' });
      expect(result).toEqual(existing);
      // should NOT call insert query
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('trims whitespace from course name', async () => {
      const row = { id: 6, name: 'ART101', userId: 1, createdAt: new Date() };
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row] });

      await service.create(1, { name: '  ART101  ' });
      // The second call (INSERT) should use trimmed name
      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[1][0]).toBe('ART101');
    });

    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create(1, { name: '   ' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when name is missing', async () => {
      await expect(service.create(1, { name: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when userId is 0', async () => {
      await expect(service.create(0, { name: 'COMP101' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
