import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { pool } from '../db';

export type CreateUserDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password ?? '';

    if (!firstName || !lastName || !email || !password) {
      throw new Error('firstName, lastName, email, and password are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, created_at`,
      [firstName, lastName, email, passwordHash],
    );

    // IMPORTANT: do NOT return password_hash
    return result.rows[0];
  }
}
