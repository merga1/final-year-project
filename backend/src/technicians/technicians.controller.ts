import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: CreateTechnicianDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateTechnicianDto>) {
    return this.service.update(id, body);
  }
}
