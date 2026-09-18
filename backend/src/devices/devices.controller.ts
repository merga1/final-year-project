import { Controller, Get, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ReadingsService } from '../readings/readings.service';
import { AlertsService } from '../alerts/alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BadRequestException } from '@nestjs/common';

@Controller()
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly readingsService: ReadingsService,
    private readonly alertsService: AlertsService,
  ) {}

  @Post('api/mobile/valve')
  @UseGuards(JwtAuthGuard)
  async toggleValve(
    @CurrentUser() user: any,
    @Body() body: { valveState?: 'OPEN' | 'CLOSED' },
  ) {
    const meterId = user.meterId;
    if (!meterId) {
      throw new BadRequestException('No smart water meter assigned to this account');
    }
    const device = await this.devicesService.findByMeterId(meterId);
    if (!device) {
      throw new BadRequestException(`Device for meter ${meterId} not found`);
    }

    const nextState = body.valveState ?? (device.valveState === 'OPEN' ? 'CLOSED' : 'OPEN');
    await this.devicesService.updateByMeterId(meterId, { valveState: nextState });

    return {
      success: true,
      meterId,
      valveState: nextState,
      message: `Valve remotely set to ${nextState}`,
    };
  }

  @Get('api/admin/devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.devicesService.findAll();
  }

  @Get('api/admin/devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  /**
   * IoT ingestion endpoint — no JWT required (devices post directly).
   * Validates with a device API key in a real system; skipped for the demo.
   */
  @Post('api/devices/reading')
  @HttpCode(201)
  async ingestReading(@Body() body: any) {
    const { deviceId, meterId, flowRateLpm, totalUsageLiters, turbidityNtu,
            valveState, connectivity, batteryPercent } = body;

    // Save the reading
    const reading = await this.readingsService.create({
      deviceId, meterId, flowRateLpm, totalUsageLiters,
      turbidityNtu, valveState, connectivity, batteryPercent,
    });

    // Update the device's live status
    await this.devicesService.updateByMeterId(meterId, {
      connectivity,
      valveState,
      batteryPercent,
      lastSeenAt: new Date(),
    });

    // Threshold checks → auto-create alerts
    if (turbidityNtu > 5) {
      await this.alertsService.createIfNotRecent(meterId, deviceId, 'WATER_QUALITY',
        `Turbidity ${turbidityNtu} NTU exceeds 5 NTU threshold`, 'critical');
    }
    if (flowRateLpm > 30) {
      await this.alertsService.createIfNotRecent(meterId, deviceId, 'HIGH_USAGE',
        `Flow rate ${flowRateLpm} L/min is above normal`, 'warning');
    }
    if (batteryPercent < 15) {
      await this.alertsService.createIfNotRecent(meterId, deviceId, 'LOW_BATTERY',
        `Battery at ${batteryPercent}%`, 'warning');
    }

    return reading;
  }
}
