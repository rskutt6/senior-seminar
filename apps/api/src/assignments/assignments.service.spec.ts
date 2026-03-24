import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';

const mockPool = {
  query: jest.fn(),
};

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: 'PG_POOL', useValue: mockPool },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validDto = {
      title: 'Homework 1',
      description: 'Write a report',
      weight: 20,
      dueAt: '2025-12-01T00:00:00.000Z',
      userId: 1,
      courseId: 2,
    };

    it('returns the created assignment on success', async () => {
      const row = { id: 10, ...validDto };
      mockPool.query.mockResolvedValueOnce({ rows: [row] });
      const result = await service.create(validDto);
      expect(result).toEqual(row);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when title is empty', async () => {
      await expect(service.create({ ...validDto, title: '   ' })).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when title is missing', async () => {
      await expect(service.create({ ...validDto, title: '' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when description is empty', async () => {
      await expect(service.create({ ...validDto, description: '   ' })).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when userId is missing', async () => {
      await expect(service.create({ ...validDto, userId: 0 })).rejects.toThrow(BadRequestException);
    });

    it('allows null courseId', async () => {
      const row = { id: 11, ...validDto, courseId: null };
      mockPool.query.mockResolvedValueOnce({ rows: [row] });
      const result = await service.create({ ...validDto, courseId: null as any });
      expect(result).toEqual(row);
    });

    it('allows null dueAt', async () => {
      const row = { id: 12, ...validDto, dueAt: null };
      mockPool.query.mockResolvedValueOnce({ rows: [row] });
      const result = await service.create({ ...validDto, dueAt: null as any });
      expect(result).toEqual(row);
    });
  });

  describe('listForUser', () => {
    it('returns a list of assignments for a user', async () => {
      const rows = [
        { id: 1, title: 'HW1', description: 'desc', userId: 5 },
        { id: 2, title: 'HW2', description: 'desc', userId: 5 },
      ];
      mockPool.query.mockResolvedValueOnce({ rows });
      const result = await service.listForUser(5);
      expect(result).toEqual(rows);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [5]);
    });

    it('returns an empty array when user has no assignments', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.listForUser(99);
      expect(result).toEqual([]);
    });
  });

  describe('getOneForUser', () => {
    it('returns the assignment when found', async () => {
      const row = { id: 3, title: 'Essay', description: 'Write it', userId: 1 };
      mockPool.query.mockResolvedValueOnce({ rows: [row] });
      const result = await service.getOneForUser(3, 1);
      expect(result).toEqual(row);
    });

    it('returns null when assignment not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.getOneForUser(999, 1);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns { ok: true } on successful delete', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.delete(1, 1);
      expect(result).toEqual({ ok: true });
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [1, 1]);
    });
  });
});
