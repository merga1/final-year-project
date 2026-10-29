import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { DevicesModule } from './devices/devices.module';
import { ReadingsModule } from './readings/readings.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';
import { AlertsModule } from './alerts/alerts.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { TechniciansModule } from './technicians/technicians.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    CustomersModule,
    DevicesModule,
    ReadingsModule,
    BillingModule,
    PaymentsModule,
    AlertsModule,
    SupportTicketsModule,
    TechniciansModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
