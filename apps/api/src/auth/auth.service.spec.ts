import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

// Mock the db module before importing AuthService
jest.mock('../db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { AuthService } from './auth.services';
import { pool } from '../db';
import * as bcrypt from 'bcrypt';

const mockQuery = pool.query as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  const validUser = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    passwordHash: '$2b$12$hashedpassword',
  };

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns user info on valid credentials', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [validUser] });
      mockCompare.mockResolvedValueOnce(true);

      const result = await service.login({
        email: 'jane@example.com',
        password: 'secret123',
      });

      expect(result).toMatchObject({
        id: 1,
        email: 'jane@example.com',
      });
      // must NOT return passwordHash
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('normalizes email to lowercase before querying', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [validUser] });
      mockCompare.mockResolvedValueOnce(true);

      await service.login({ email: 'JANE@EXAMPLE.COM', password: 'secret123' });

      const calledWith = mockQuery.mock.calls[0][1];
      expect(calledWith[0]).toBe('jane@example.com');
    });

    it('throws BadRequestException when email is missing', async () => {
      await expect(
        service.login({ email: '', password: 'secret123' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when password is missing', async () => {
      await expect(
        service.login({ email: 'jane@example.com', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.login({ email: 'ghost@example.com', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [validUser] });
      mockCompare.mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws InternalServerErrorException on unexpected db error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db timeout'));

      await expect(
        service.login({ email: 'jane@example.com', password: 'secret123' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
