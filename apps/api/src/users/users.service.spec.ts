import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

// Mock the db module before importing UsersService
jest.mock('../db', () => ({
  pool: { query: jest.fn() },
}));

// Mock bcrypt so tests run fast and don't do real hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

import { UsersService } from './users.service';
import { pool } from '../db';

const mockQuery = pool.query as jest.Mock;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const validDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    };

    it('creates and returns a new user', async () => {
      const row = { id: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' };
      mockQuery.mockResolvedValueOnce({ rows: [row] });

      const result = await service.create(validDto);
      expect(result).toEqual(row);
    });

    it('normalizes email to lowercase', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] });

      await service.create({ ...validDto, email: 'JANE@EXAMPLE.COM' });
      const calledWith = mockQuery.mock.calls[0][1];
      expect(calledWith[2]).toBe('jane@example.com');
    });

    it('throws BadRequestException when firstName is missing', async () => {
      await expect(
        service.create({ ...validDto, firstName: '' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when email is missing', async () => {
      await expect(
        service.create({ ...validDto, email: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when password is missing', async () => {
      await expect(
        service.create({ ...validDto, password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on duplicate email (pg error 23505)', async () => {
      const pgError = { code: '23505' };
      mockQuery.mockRejectedValueOnce(pgError);

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on unexpected db error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection lost'));

      await expect(service.create(validDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all users', async () => {
      const rows = [
        { id: 1, first_name: 'Jane', email: 'jane@example.com' },
        { id: 2, first_name: 'John', email: 'john@example.com' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await service.findAll();
      expect(result).toEqual(rows);
    });

    it('returns empty array when no users exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('throws InternalServerErrorException on db error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db down'));

      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a user by id', async () => {
      const row = { id: 1, first_name: 'Jane', email: 'jane@example.com' };
      mockQuery.mockResolvedValueOnce({ rows: [row] });

      const result = await service.findOne(1);
      expect(result).toEqual(row);
    });

    it('throws BadRequestException when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(service.findOne(999)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid id (0)', async () => {
      await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for NaN id', async () => {
      await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on unexpected db error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('network error'));

      await expect(service.findOne(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
