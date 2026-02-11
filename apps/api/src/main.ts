import * as path from 'path';
import * as dotenv from 'dotenv';

// Load apps/api/.env reliably (works no matter where you run from)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:3000"], // your Next dev server
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(Number(process.env.PORT) || 4000);
}

bootstrap();
