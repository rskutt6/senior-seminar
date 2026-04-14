import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AssignmentsModule } from "./assignments/assignments.module";
import { CoursesModule } from './courses/courses.module';
import { PdfModule } from './pdf/pdf.module';
import { AudioModule } from './audio/audio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule, AuthModule, AssignmentsModule, CoursesModule, PdfModule, AudioModule],
  controllers: [AppController],
})
export class AppModule {}
