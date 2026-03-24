import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import * as createAssignmentDto from './dto/create-assignment.dto';
import * as updateAssignmentDto from './dto/update-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  async create(@Body() dto: createAssignmentDto.CreateAssignmentDto) {
    return this.assignments.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: updateAssignmentDto.UpdateAssignmentDto,
  ) {
    return this.assignments.update(id, userId, dto);
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