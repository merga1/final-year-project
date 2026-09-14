import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard)
  getMobileTickets(@CurrentUser() user: any) {
    return this.service.findByCustomer(user.sub);
  }

  @Post('api/mobile/support-tickets')
  @UseGuards(JwtAuthGuard)
  createTicket(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create({
      customerId: user.sub,
      customerName: user.name,
      ...body,
    });
  }
}
