import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AssignmentsModule } from "./assignments/assignments.module";
import { CoursesModule } from './courses/courses.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [UsersModule, AuthModule, AssignmentsModule, CoursesModule, PdfModule],
  controllers: [AppController],
})
export class AppModule {}
