'use strict';
require('reflect-metadata');

const express = require('express');
const server = express();
let appReady = null;

async function bootstrap() {
  // Dynamic import of ESM @nestjs/core and NestJS modules
  const { NestFactory } = await import('@nestjs/core');
  const { ExpressAdapter } = await import('@nestjs/platform-express');
  const { ValidationPipe } = await import('@nestjs/common');
  const { AppModule } = await import('../dist/app.module.js');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
}

function getApp() {
  if (!appReady) {
    appReady = bootstrap();
  }
  return appReady;
}

module.exports = async function handler(req, res) {
  await getApp();
  server(req, res);
};
