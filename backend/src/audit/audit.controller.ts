import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
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
  getAuditLogs(@Query('limit') limit?: string) {
    const parsed = parseInt(limit ?? '', 10);
    return this.auditService.findAll(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100);
  }

  @Post()
  createAuditLog(@CurrentUser() user: any, @Body() body: CreateAuditLogDto) {
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
