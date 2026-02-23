import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CoursesService } from './courses.service';

type CreateCourseDto = {
  name: string; // e.g. "COMP101" or "COMP101 — Intro to CS"
};

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  // GET /courses?userId=1
  @Get()
  async list(@Query('userId', ParseIntPipe) userId: number) {
    return this.courses.listForUser(userId);
  }

  // POST /courses?userId=1
  @Post()
  async create(
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courses.create(userId, dto);
  }
}
