import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async create(dto: CreateAssignmentDto) {
    if (!dto.description?.trim())
      if (dto.userId == null) throw new BadRequestException('userId required');

    if (!dto.userId) throw new BadRequestException('userId required');

    const query = `
      INSERT INTO public."Assignment"
        (description, weight, "dueAt", "userId", "courseId", "createdAt", "updatedAt")
      VALUES
        ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING
        id,
        description,
        weight,
        "dueAt",
        "userId",
        "courseId";
    `;

    const values = [
      dto.description,
      dto.weight ?? null,
      dto.dueAt ? new Date(dto.dueAt) : null,
      dto.userId,
      dto.courseId ?? null, // 👈 allow null
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
