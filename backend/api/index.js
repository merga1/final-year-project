'use strict';
require('dotenv').config();
require('reflect-metadata');

const express = require('express');
const server = express();
let appReady = null;

async function bootstrap() {
  const { NestFactory } = require('@nestjs/core');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/src/app.module');

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
