import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api/admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminOverview() {
    return this.appService.getAdminOverview();
  }

  @Get('api/mobile/home')
  @UseGuards(JwtAuthGuard)
  getMobileHome(@CurrentUser() user: any) {
    return this.appService.getMobileHome(user.sub, user.meterId);
  }
}
