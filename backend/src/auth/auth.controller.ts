import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /** Unified login */
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

  /** Change password for logged in user */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.service.changePassword(user.sub, body.oldPassword, body.newPassword);
  }
}
