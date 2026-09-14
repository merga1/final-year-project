import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/admin/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.acknowledge(id, user.name ?? user.email);
  }
}
