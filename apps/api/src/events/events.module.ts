import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}