import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AssignmentsModule } from "./assignments/assignments.module";
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [UsersModule, AuthModule, AssignmentsModule, CoursesModule],
  controllers: [AppController],
})
export class AppModule {}
