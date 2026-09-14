import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', './water.sqlite'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // auto-creates tables from entities (fine for dev/demo)
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
