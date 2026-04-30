import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';

@Injectable()
export class EventsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async findAll(userId: number) {
    const res = await this.pool.query(
      `
      SELECT id, title, date, time, notes, link, "userId"
      FROM public."Event"
      WHERE "userId" = $1
      ORDER BY date ASC
      `,
      [userId],
    );

    return res.rows;
  }

  async create(userId: number, body: any) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const time = typeof body.time === 'string' && body.time.trim() ? body.time.trim() : null;
    const notes =
      typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
    const link =
      typeof body.link === 'string' && body.link.trim() ? body.link.trim() : null;

    if (!userId) {
      throw new BadRequestException('userId required');
    }

    if (!title) {
      throw new BadRequestException('title required');
    }

    if (!date) {
      throw new BadRequestException('date required');
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('valid date required');
    }

    const res = await this.pool.query(
      `
      INSERT INTO public."Event" (title, date, time, notes, link, "userId")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, date, time, notes, link, "userId"
      `,
      [title, parsedDate, time, notes, link, userId],
    );

    return res.rows[0];
  }

  async update(id: number, userId: number, body: any) {
    if (!id) {
      throw new BadRequestException('id required');
    }

    if (!userId) {
      throw new BadRequestException('userId required');
    }

    const current = await this.pool.query(
      `
      SELECT *
      FROM public."Event"
      WHERE id = $1 AND "userId" = $2
      `,
      [id, userId],
    );

    if (current.rowCount === 0) {
      throw new BadRequestException('event not found');
    }

    const existing = current.rows[0];

    const title =
      typeof body.title === 'string' ? body.title.trim() : existing.title;

    const date =
      typeof body.date === 'string' && body.date.trim()
        ? new Date(body.date)
        : existing.date;

    const time =
      body.time === null
        ? null
        : typeof body.time === 'string'
          ? body.time.trim()
          : existing.time;

    const notes =
      body.notes === null
        ? null
        : typeof body.notes === 'string'
          ? body.notes.trim()
          : existing.notes;

    const link =
      body.link === null
        ? null
        : typeof body.link === 'string'
          ? body.link.trim()
          : existing.link;

    if (Number.isNaN(new Date(date).getTime())) {
      throw new BadRequestException('valid date required');
    }

    const res = await this.pool.query(
      `
      UPDATE public."Event"
      SET title = $1,
          date = $2,
          time = $3,
          notes = $4,
          link = $5
      WHERE id = $6 AND "userId" = $7
      RETURNING id, title, date, time, notes, link, "userId"
      `,
      [title, date, time || null, notes || null, link || null, id, userId],
    );

    return res.rows[0];
  }

  async delete(id: number, userId: number) {
    await this.pool.query(
      `
      DELETE FROM public."Event"
      WHERE id = $1 AND "userId" = $2
      `,
      [id, userId],
    );

    return { success: true };
  }
}