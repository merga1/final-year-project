import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /** Unified login — returns admin role if email ends with @admin.water */
  @Post('login')
  @HttpCode(200)
  login(@Body() body: { email: string; password: string }) {
    return this.service.loginAdmin(body.email, body.password);
  }

  /** Customer self-registration via mobile app */
  @Post('register')
  register(@Body() body: { name: string; email: string; password: string; meterId?: string }) {
    return this.service.register(body.name, body.email, body.password, body.meterId);
  }
}
