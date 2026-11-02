import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

const rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const dbUrl = rawDbUrl ? rawDbUrl.replace(/^\uFEFF/, '').trim() : undefined;

@Module({
  imports: [
    TypeOrmModule.forRoot(
      dbUrl
        ? {
            type: 'postgres',
            url: dbUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
            logging: false,
          }
        : {
            type: 'better-sqlite3',
            database: process.env.DB_PATH || './water.sqlite',
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          },
    ),
  ],
})
export class DatabaseModule {}
