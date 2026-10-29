import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, NotFoundException } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  @Get('api/admin/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.service.findAll();
  }

  @Patch('api/admin/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Get('api/mobile/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMobileTickets(@CurrentUser() user: any) {
    return this.service.findByCustomer(user.sub);
  }

  @Post('api/mobile/support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  createTicket(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createCustomerTicket({
      customerId: user.sub,
      customerName: user.name,
      ...body,
    });
  }

  @Get('api/mobile/support-tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  getCustomerTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findByCustomer(user.sub).then((tickets) => {
      const ticket = tickets.find((item) => item.id === id);
      if (!ticket) throw new NotFoundException('Ticket not found');
      return ticket;
    });
  }

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
  updateTechnicianTicket(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.transitionForTechnician(id, user.technicianId ?? user.sub, body);
  }
}
