import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateChapaPaymentDto, CreatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('api/admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.service.findAll();
  }

  @Post('api/mobile/payments')
  @UseGuards(JwtAuthGuard)
  createPayment(@CurrentUser() user: any, @Body() body: CreatePaymentDto) {
    return this.service.createForCustomer({ id: user.sub, name: user.name }, body);
  }

  @Get('api/mobile/payments')
  @UseGuards(JwtAuthGuard)
  getMobilePayments(@CurrentUser() user: any) {
    return this.service.findByCustomer(user.sub);
  }

  @Post('api/mobile/payments/chapa')
  @UseGuards(JwtAuthGuard)
  createChapaPayment(@CurrentUser() user: any, @Body() body: CreateChapaPaymentDto) {
    return this.service.createChapaPayment({ id: user.sub, name: user.name }, body);
  }
}
