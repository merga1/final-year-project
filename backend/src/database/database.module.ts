import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseUrl } from '../config/env';

/**
 * DB_SSL (PostgreSQL only):
 *   disable  - no TLS
 *   require  - TLS without certificate verification (default; works with most hosted DBs)
 *   verify   - TLS with full certificate verification (recommended when the host CA is trusted)
 */
function pgSsl() {
  switch ((process.env.DB_SSL || 'require').toLowerCase()) {
    case 'disable':
      return false;
    case 'verify':
      return { rejectUnauthorized: true };
    default:
      return { rejectUnauthorized: false };
  }
}

const dbUrl = getDatabaseUrl();

@Module({
  imports: [
    TypeOrmModule.forRoot(
      dbUrl
        ? {
            type: 'postgres',
            url: dbUrl,
            autoLoadEntities: true,
            // Production schema changes should be deliberate: set DB_SYNC=true once to create tables.
            synchronize: process.env.DB_SYNC === 'true',
            ssl: pgSsl(),
            logging: false,
          }
        : {
            type: 'better-sqlite3',
            database: process.env.DB_PATH || './water.sqlite',
            autoLoadEntities: true,
            synchronize: true,
            logging: false,
          },
    ),
  ],
})
export class DatabaseModule {}
