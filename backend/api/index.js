'use strict';
// Vercel serverless entry point. Requires a PostgreSQL DATABASE_URL
// (the local SQLite file does not persist on serverless platforms).
require('dotenv').config();
require('reflect-metadata');

const express = require('express');
const server = express();
let appReady = null;

async function bootstrap() {
  const { NestFactory } = require('@nestjs/core');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const { AppModule } = require('../dist/app.module');
  const { configureApp } = require('../dist/app.config');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  configureApp(app);
  await app.init();
}

module.exports = async function handler(req, res) {
  if (!appReady) appReady = bootstrap();
  await appReady;
  server(req, res);
};
