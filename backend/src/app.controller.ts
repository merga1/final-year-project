import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api/admin/overview')
  getAdminOverview() {
    return this.appService.getAdminOverview();
  }

  @Get('api/mobile/home')
  getMobileHome() {
    return this.appService.getMobileHome();
  }
}
