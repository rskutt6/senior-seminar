import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async create(dto: CreateAssignmentDto) {
    const title = typeof dto.title === 'string' ? dto.title.trim() : '';
    const description =
      typeof dto.description === 'string' ? dto.description.trim() : '';

    if (!title) {
      throw new BadRequestException('title required');
    }

    if (!description) {
      throw new BadRequestException('description required');
    }

    if (!dto.userId) {
      throw new BadRequestException('userId required');
    }

    const query = `
    INSERT INTO public."Assignment" (
      title,
      description,
      weight,
      "dueAt",
      "userId",
      "courseId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      NOW(),
      NOW()
    )
    RETURNING
      id,
      title,
      description,
      weight,
      "dueAt",
      "userId",
      "courseId";
  `;

    const values = [
      title,
      description,
      dto.weight ?? null,
      dto.dueAt ? new Date(dto.dueAt) : null,
      dto.userId,
      dto.courseId ?? null,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async listForUser(userId: number) {
    if (userId == null || Number.isNaN(userId)) {
      throw new BadRequestException('valid userId required');
      }

    const { rows } = await this.pool.query(
      `
      SELECT
        id,
        title,
        description,
        weight,
        "dueAt",
        "userId",
        "courseId"
      FROM public."Assignment"
      WHERE "userId" = $1
      ORDER BY "dueAt" ASC;
      `,
      [userId],
    );

    return rows;
  }

  async getOneForUser(assignmentId: number, userId: number) {
    if (assignmentId == null || Number.isNaN(assignmentId)) {
      throw new BadRequestException('valid assignmentId required');
    }

    if (userId == null || Number.isNaN(userId)) {
      throw new BadRequestException('valid userId required');
    }

    const { rows } = await this.pool.query(
      `
      SELECT
        id,
        title,
        description,
        weight,
        "dueAt",
        "userId",
        "courseId"
      FROM public."Assignment"
      WHERE id = $1 AND "userId" = $2
      LIMIT 1;
      `,
      [assignmentId, userId],
    );

    return rows[0] ?? null;
  }

  async delete(assignmentId: number, userId: number) {
    if (assignmentId == null || Number.isNaN(assignmentId)) {
      throw new BadRequestException('valid assignmentId required');
    }

    if (userId == null || Number.isNaN(userId)) {
      throw new BadRequestException('valid userId required');
    }

    await this.pool.query(
      `
      DELETE FROM public."Assignment"
      WHERE id = $1 AND "userId" = $2;
      `,
      [assignmentId, userId],
    );

    return { ok: true };
  }
}