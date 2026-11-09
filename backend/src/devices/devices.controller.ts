import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DeviceKeyGuard } from './device-key.guard';
import { CreateDeviceDto, ReadingDto, ValveCommandDto } from './dto/device.dto';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // ── Customer ────────────────────────────────────────────────────────────────

  @Post('api/mobile/valve')
  @UseGuards(JwtAuthGuard)
  async toggleValve(@CurrentUser() user: any, @Body() body: ValveCommandDto) {
    if (!user.meterId) {
      throw new BadRequestException('No smart water meter assigned to this account');
    }
    const { command, valveState } = await this.devicesService.setValve(user.sub, user.meterId, body.valveState);
    return {
      success: true,
      commandId: command.id,
      pending: false,
      meterId: user.meterId,
      valveState,
      message: `Valve remotely set to ${valveState}`,
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Get('api/admin/devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.devicesService.findAll();
  }

  @Post('api/admin/devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateDeviceDto) {
    return this.devicesService.create(body);
  }

  @Get('api/admin/devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.devicesService.resolve(id);
  }

  @Patch('api/admin/devices/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async activate(@Param('id') id: string) {
    const device = await this.devicesService.resolve(id);
    await this.devicesService.updateByMeterId(device.meterId, { connectivity: 'ONLINE' });
    return { success: true, message: 'Device activated', connectivity: 'ONLINE' };
  }

  @Patch('api/admin/devices/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deactivate(@Param('id') id: string) {
    const device = await this.devicesService.resolve(id);
    await this.devicesService.updateByMeterId(device.meterId, { connectivity: 'OFFLINE' });
    return { success: true, message: 'Device deactivated', connectivity: 'OFFLINE' };
  }

  // ── IoT meters ──────────────────────────────────────────────────────────────

  /** Telemetry ingestion. Authenticated with the shared `x-device-key` header (see DeviceKeyGuard). */
  @Post('api/devices/reading')
  @UseGuards(DeviceKeyGuard)
  @HttpCode(201)
  ingestReading(@Body() body: ReadingDto) {
    return this.devicesService.ingestReading(body);
  }
}
