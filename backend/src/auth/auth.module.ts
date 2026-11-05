import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomersModule } from '../customers/customers.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { DevicesModule } from '../devices/devices.module';

const rawSecret = process.env.JWT_SECRET || 'smart_water_jwt_secret_2026_final_year';
const JWT_SECRET = rawSecret.replace(/^\uFEFF/, '').trim();

@Module({
  imports: [
    PassportModule,
    CustomersModule,
    TechniciansModule,
    DevicesModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: 604800 }, // 7 days
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
