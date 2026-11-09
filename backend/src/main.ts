import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApp } from './app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Smart Water Backend running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();
