import * as path from 'path';
import * as dotenv from 'dotenv';

// Load apps/api/.env reliably (works no matter where you run from)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // If you want all routes to be /api/... uncomment this:
  // app.setGlobalPrefix("api");

  await app.listen(Number(process.env.PORT) || 4000);
}

bootstrap();
