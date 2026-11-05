import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('api/admin/billing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.service.findAll();
  }

  @Patch('api/admin/billing/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Get('api/mobile/bills')
  @UseGuards(JwtAuthGuard)
  getMobileBills(@CurrentUser() user: any) {
    return this.service.findByCustomer(user.sub);
  }
}
