import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

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
UPDATE public."Assignment"
SET
  title = $1,
  description = $2,
  weight = $3,
  "dueAt" = $4,
  "courseId" = $5,
  "assignmentType" = $6,
  "summary" = $7,
  "priority" = $8,
  "status" = $9,
  "checklistItems" = $10,
  "updatedAt" = NOW()
WHERE id = $11 AND "userId" = $12
RETURNING *;
`;

const values = [
  dto.title,
  dto.description,
  dto.weight,
  dto.dueAt,
  dto.courseId,
  dto.assignmentType,
  dto.summary,
  dto.priority,
  dto.status,
  JSON.stringify(dto.checklistItems || []),
  id,
  userId,
];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async update(assignmentId: number, userId: number, dto: UpdateAssignmentDto) {
    if (assignmentId == null || Number.isNaN(assignmentId)) {
      throw new BadRequestException('valid assignmentId required');
    }

    if (userId == null || Number.isNaN(userId)) {
      throw new BadRequestException('valid userId required');
    }

    const existing = await this.getOneForUser(assignmentId, userId);

    if (!existing) {
      throw new BadRequestException('assignment not found');
    }

    const title =
      typeof dto.title === 'string' ? dto.title.trim() : existing.title ?? '';

    const description =
      typeof dto.description === 'string'
        ? dto.description.trim()
        : existing.description ?? '';

    if (!title) {
      throw new BadRequestException('title required');
    }

    if (!description) {
      throw new BadRequestException('description required');
    }

    const weight =
      dto.weight === undefined ? existing.weight : dto.weight ?? null;

    const dueAt =
      dto.dueAt === undefined
        ? existing.dueAt
        : dto.dueAt
        ? new Date(dto.dueAt)
        : null;

    const courseId =
      dto.courseId === undefined ? existing.courseId : dto.courseId ?? null;

    const { rows } = await this.pool.query(
      `
      UPDATE public."Assignment"
      SET
        title = $1,
        description = $2,
        weight = $3,
        "dueAt" = $4,
        "courseId" = $5,
        "updatedAt" = NOW()
      WHERE id = $6 AND "userId" = $7
      RETURNING
        id,
        title,
        description,
        weight,
        "dueAt",
        "userId",
        "courseId";
      `,
      [title, description, weight, dueAt, courseId, assignmentId, userId],
    );

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