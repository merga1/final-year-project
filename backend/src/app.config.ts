import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getCorsOrigins } from './config/env';

/** Global settings shared by the local server (main.ts) and Vercel (api/index.js). */
export function configureApp(app: INestApplication) {
  app.enableCors({ origin: getCorsOrigins(), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
}
