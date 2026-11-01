import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 100;
    return this.auditService.findAll(lim);
  }

  @Post()
  async createAuditLog(
    @CurrentUser() user: any,
    @Body() body: { action: string; category?: string; targetEntity: string; details: string; status?: 'SUCCESS' | 'FAILED' | 'WARNING' },
  ) {
    const actor = user?.name ? `${user.name} (${user.email})` : user?.email ?? 'Admin';
    return this.auditService.create({
      actor,
      action: body.action,
      category: body.category ?? 'GENERAL',
      targetEntity: body.targetEntity,
      details: body.details,
      status: body.status ?? 'SUCCESS',
    });
  }
}
