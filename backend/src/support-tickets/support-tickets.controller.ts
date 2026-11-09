import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  AdminCreateTicketDto, AdminUpdateTicketDto, CreateCustomerTicketDto, TechnicianTransitionDto,
} from './dto/ticket.dto';

@Controller()
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  // ── Admin endpoints ───────────────────────────────────────────────────────────

  @Get('api/admin/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.service.findAll();
  }

  @Post('api/admin/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createAdminTicket(@Body() body: AdminCreateTicketDto) {
    return this.service.createAdminTicket(body);
  }

  @Get('api/admin/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('api/admin/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: AdminUpdateTicketDto) {
    return this.service.update(id, body);
  }

  // ── Customer mobile endpoints ─────────────────────────────────────────────────

  @Get('api/mobile/support-tickets')
  @UseGuards(JwtAuthGuard)
  getMobileTickets(@CurrentUser() user: any) {
    return this.service.findByCustomer(user.sub);
  }

  @Post('api/mobile/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  createTicket(@CurrentUser() user: any, @Body() body: CreateCustomerTicketDto) {
    return this.service.createCustomerTicket({
      ...body,
      customerId: user.sub,
      customerName: user.name,
    });
  }

  @Get('api/mobile/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  getCustomerTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOneForCustomer(id, user.sub);
  }

  // ── Technician endpoints ──────────────────────────────────────────────────────

  @Get('api/technician/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technician')
  getTechnicianTickets(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.service.findByTechnician(user.technicianId ?? user.sub, status);
  }

  @Get('api/technician/tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technician')
  getTechnicianTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOneForTechnician(id, user.technicianId ?? user.sub);
  }

  @Patch('api/technician/tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technician')
  updateTechnicianTicket(@CurrentUser() user: any, @Param('id') id: string, @Body() body: TechnicianTransitionDto) {
    return this.service.transitionForTechnician(id, user.technicianId ?? user.sub, body);
  }
}
