import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Load environment variables before creating the app
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
}

bootstrap().catch((err) =>
  console.error('Error starting server on port:', process.env.PORT, err),
);
