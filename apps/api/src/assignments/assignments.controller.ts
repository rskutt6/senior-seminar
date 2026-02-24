import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import * as createAssignmentDto from './dto/create-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  async create(@Body() dto: createAssignmentDto.CreateAssignmentDto) {
    return this.assignments.create(dto);
  }

  @Get()
  async list(@Query('userId', ParseIntPipe) userId: number) {
    return this.assignments.listForUser(userId);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.assignments.delete(id, userId);
  }

  @Get(':id')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.assignments.getOneForUser(id, userId);
  }
}
