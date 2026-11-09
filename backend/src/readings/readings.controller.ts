import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class ReadingsController {
  constructor(private readonly service: ReadingsService) {}

  @Get('api/admin/readings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('meterId') meterId?: string) {
    return this.service.findByMeterId(meterId || undefined, 100);
  }

  @Get('api/admin/readings/daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getDailyUsage(@Query('meterId') meterId?: string) {
    return this.service.getDailyUsage(meterId);
  }

  @Get('api/admin/readings/zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getZoneUsage() {
    return this.service.getZoneUsage();
  }

  @Get('api/admin/readings/quality')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getQualityTrend() {
    return this.service.getQualityTrend();
  }

  @Get('api/mobile/readings')
  @UseGuards(JwtAuthGuard)
  getMobileReadings(@CurrentUser() user: any) {
    // A customer without a meter must never fall through to "all meters".
    return user.meterId ? this.service.findByMeterId(user.meterId, 20) : [];
  }

  @Get('api/mobile/readings/daily')
  @UseGuards(JwtAuthGuard)
  getMobileDailyUsage(@CurrentUser() user: any) {
    return user.meterId ? this.service.getDailyUsage(user.meterId) : [];
  }
}
