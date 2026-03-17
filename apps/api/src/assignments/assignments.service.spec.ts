import { BadRequestException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    service = new AssignmentsService(mockPool as any);
  });

  describe('create', () => {
    it('creates an assignment tied to the provided userId', async () => {
      const dto = {
        description: 'Math Homework',
        weight: 20,
        dueAt: '2026-03-20T12:00:00.000Z',
        userId: 1,
        courseId: 3,
      };

      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 99,
            description: 'Math Homework',
            weight: 20,
            dueAt: '2026-03-20T12:00:00.000Z',
            userId: 1,
            courseId: 3,
          },
        ],
      });

      const result = await service.create(dto);

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query.mock.calls[0][1]).toEqual([
        dto.description,
        dto.weight,
        new Date(dto.dueAt),
        dto.userId,
        dto.courseId,
      ]);

      expect(result.userId).toBe(1);
      expect(result.description).toBe('Math Homework');
    });

    it('throws when userId is missing', async () => {
      await expect(
        service.create({
          description: 'Test assignment',
          weight: 10,
          dueAt: '2026-03-20T12:00:00.000Z',
          userId: undefined as any,
          courseId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listForUser', () => {
    it('returns only assignments for the requested user', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            description: 'User 1 assignment',
            userId: 1,
            dueAt: '2026-03-21T12:00:00.000Z',
            weight: 10,
            courseId: 2,
          },
        ],
      });

      const result = await service.listForUser(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE "userId" = $1'),
        [1],
      );
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(1);
    });

    it('throws when userId is invalid', async () => {
      await expect(service.listForUser(NaN)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOneForUser', () => {
    it('returns the assignment only when it belongs to that user', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 5,
            description: 'Essay',
            userId: 2,
            dueAt: '2026-03-25T15:00:00.000Z',
            weight: 15,
            courseId: 4,
          },
        ],
      });

      const result = await service.getOneForUser(5, 2);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND "userId" = $2'),
        [5, 2],
      );
      expect(result).not.toBeNull();
      expect(result.userId).toBe(2);
    });

    it('returns null when assignment does not belong to that user', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
      });

      const result = await service.getOneForUser(5, 999);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes only when assignment belongs to the provided user', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.delete(10, 3);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND "userId" = $2'),
        [10, 3],
      );
      expect(result).toEqual({ ok: true });
    });

    it('throws when userId is invalid', async () => {
      await expect(service.delete(10, NaN)).rejects.toThrow(BadRequestException);
    });
  });
});