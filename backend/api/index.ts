import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { ValidationPipe } from '@nestjs/common';

const server: Express = express();
let isReady = false;

async function bootstrap(): Promise<Express> {
  if (!isReady) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    isReady = true;
  }
  return server;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
