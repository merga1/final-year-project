import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/admin/technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TechniciansController {
  constructor(private readonly service: TechniciansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}
