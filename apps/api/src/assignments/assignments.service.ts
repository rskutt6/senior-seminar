import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async create(dto: CreateAssignmentDto) {
    const title = dto.title?.trim();
    const description = dto.description?.trim();

    if (!title) throw new BadRequestException('title required');
    if (!description) throw new BadRequestException('description required');
    if (!dto.userId) throw new BadRequestException('userId required');

    const { rows } = await this.pool.query(
      `
      INSERT INTO public."Assignment" (
        title,
        description,
        weight,
        "dueAt",
        "userId",
        "courseId",
        "assignmentType",
        "problemCount",
        "pageCount",
        summary,
        "checklistOverview",
        "checklistItems",
        priority,
        status,
        notes,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        NOW(),NOW()
      )
      RETURNING *;
      `,
      [
        title,
        description,
        dto.weight ?? null,
        dto.dueAt ? new Date(dto.dueAt) : null,
        dto.userId,
        dto.courseId ?? null,
        dto.assignmentType ?? null,
        dto.problemCount ?? null,
        dto.pageCount ?? null,
        dto.summary ?? null,
        dto.checklistOverview ?? null,
        dto.checklistItems ? JSON.stringify(dto.checklistItems) : null,
        dto.priority ?? null,
        dto.status ?? null,
        dto.notes ?? null,
      ],
    );

    return rows[0];
  }

  async update(id: number, userId: number, dto: UpdateAssignmentDto) {
    const existing = await this.getOneForUser(id, userId);
    if (!existing) throw new BadRequestException('not found');

    const title =
      dto.title === undefined ? existing.title : dto.title?.trim() ?? '';
    const description =
      dto.description === undefined
        ? existing.description
        : dto.description?.trim() ?? '';

    if (!title) throw new BadRequestException('title required');
    if (!description) throw new BadRequestException('description required');

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

    const assignmentType =
      dto.assignmentType === undefined
        ? existing.assignmentType
        : dto.assignmentType ?? null;

    const problemCount =
      dto.problemCount === undefined
        ? existing.problemCount
        : dto.problemCount ?? null;

    const pageCount =
      dto.pageCount === undefined ? existing.pageCount : dto.pageCount ?? null;

    const summary =
      dto.summary === undefined ? existing.summary : dto.summary ?? null;

    const checklistOverview =
      dto.checklistOverview === undefined
        ? existing.checklistOverview
        : dto.checklistOverview ?? null;

    const checklistItems =
      dto.checklistItems === undefined
        ? existing.checklistItems
        : dto.checklistItems
        ? JSON.stringify(dto.checklistItems)
        : null;

    const priority =
      dto.priority === undefined ? existing.priority : dto.priority ?? null;

    const status =
      dto.status === undefined ? existing.status : dto.status ?? null;

    const notes = dto.notes === undefined ? existing.notes : dto.notes ?? null;

    const { rows } = await this.pool.query(
      `
      UPDATE public."Assignment"
      SET
        title=$1,
        description=$2,
        weight=$3,
        "dueAt"=$4,
        "courseId"=$5,
        "assignmentType"=$6,
        "problemCount"=$7,
        "pageCount"=$8,
        summary=$9,
        "checklistOverview"=$10,
        "checklistItems"=$11,
        priority=$12,
        status=$13,
        notes=$14,
        "updatedAt"=NOW()
      WHERE id=$15 AND "userId"=$16
      RETURNING *;
      `,
      [
        title,
        description,
        weight,
        dueAt,
        courseId,
        assignmentType,
        problemCount,
        pageCount,
        summary,
        checklistOverview,
        checklistItems,
        priority,
        status,
        notes,
        id,
        userId,
      ],
    );

    return rows[0];
  }

  async getOneForUser(id: number, userId: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM public."Assignment" WHERE id=$1 AND "userId"=$2 LIMIT 1`,
      [id, userId],
    );
    return rows[0] ?? null;
  }

  async listForUser(userId: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM public."Assignment" WHERE "userId"=$1 ORDER BY "dueAt" ASC`,
      [userId],
    );
    return rows;
  }

  async delete(id: number, userId: number) {
    await this.pool.query(
      `DELETE FROM public."Assignment" WHERE id=$1 AND "userId"=$2`,
      [id, userId],
    );
    return { ok: true };
  }
}
