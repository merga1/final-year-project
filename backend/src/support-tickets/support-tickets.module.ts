import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './support-ticket.entity';
import { Customer } from '../customers/customer.entity';
import { Device } from '../devices/device.entity';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TechniciansModule } from '../technicians/technicians.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, Customer, Device]), NotificationsModule, TechniciansModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
