import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomersModule } from '../customers/customers.module';
import { TechniciansModule } from '../technicians/technicians.module';

@Module({
  imports: [
    PassportModule,
    CustomersModule,
    TechniciansModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'smart_water_jwt_secret_2026_final_year'),
        signOptions: { expiresIn: 604800 }, // 7 days in seconds
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
