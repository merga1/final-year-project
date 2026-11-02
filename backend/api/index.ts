import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';

const server = express();
let appReady: Promise<void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
}

function getApp(): Promise<void> {
  if (!appReady) {
    appReady = bootstrap();
  }
  return appReady;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await getApp();
  server(req, res);
}
