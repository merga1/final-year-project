import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { ValveCommand } from './valve-command.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { ReadingsModule } from '../readings/readings.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device, ValveCommand]), ReadingsModule, AlertsModule, NotificationsModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
