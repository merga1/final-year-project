import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './support-ticket.entity';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TechniciansModule } from '../technicians/technicians.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket]), NotificationsModule, TechniciansModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
