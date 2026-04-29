import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Query('userId', ParseIntPipe) userId: number) {
    return this.eventsService.findAll(userId);
  }

  @Post()
  create(
    @Query('userId', ParseIntPipe) userId: number,
    @Body() body: any,
  ) {
    return this.eventsService.create(userId, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body() body: any,
  ) {
    return this.eventsService.update(id, userId, body);
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.eventsService.delete(id, userId);
  }
}