'use strict';
// Vercel serverless entry point. Requires a PostgreSQL DATABASE_URL
// (the local SQLite file does not persist on serverless platforms).
require('dotenv').config();
require('reflect-metadata');

// Ensure pg driver is retained in package bundle
try {
  require('pg');
} catch (_) {}

const DEFAULT_SUPABASE_URL =
  'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = DEFAULT_SUPABASE_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'smart-water-production-jwt-secret-vercel-2026';
}

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
  try {
    if (!appReady) {
      appReady = bootstrap().catch((err) => {
        appReady = null;
        throw err;
      });
    }
    await appReady;
    server(req, res);
  } catch (err) {
    console.error('Vercel serverless bootstrap failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Backend initialization failed',
          message: err.message,
        }),
      );
    }
  }
};

