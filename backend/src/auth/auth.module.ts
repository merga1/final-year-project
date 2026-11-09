import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomersModule } from '../customers/customers.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { DevicesModule } from '../devices/devices.module';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';
import { getJwtSecret, JWT_EXPIRES_IN_SECONDS } from '../config/env';

@Module({
  imports: [
    PassportModule,
    CustomersModule,
    TechniciansModule,
    DevicesModule,
    SupportTicketsModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: JWT_EXPIRES_IN_SECONDS },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
