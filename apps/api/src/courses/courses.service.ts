import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

type CreateCourseDto = {
  name: string;
};

@Injectable()
export class CoursesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listForUser(userId: number) {
    if (!userId) throw new BadRequestException('userId is required');

    const { rows } = await this.pool.query(
      `
      SELECT id, name, "userId", "createdAt"
      FROM public."Course"
      WHERE "userId" = $1
      ORDER BY name ASC;
      `,
      [userId],
    );

    return rows;
  }

  async create(userId: number, dto: CreateCourseDto) {
    if (!userId) throw new BadRequestException('userId is required');
    if (!dto?.name?.trim()) throw new BadRequestException('name is required');

    const name = dto.name.trim();

    // prevent duplicates per user
    const existing = await this.pool.query(
      `
      SELECT id, name, "userId", "createdAt"
      FROM public."Course"
      WHERE "userId" = $1 AND name = $2
      LIMIT 1;
      `,
      [userId, name],
    );

    if (existing.rows.length) return existing.rows[0];

    const { rows } = await this.pool.query(
      `
      INSERT INTO public."Course" (name, "userId")
      VALUES ($1, $2)
      RETURNING id, name, "userId", "createdAt";
      `,
      [name, userId],
    );

    return rows[0];
  }
}
