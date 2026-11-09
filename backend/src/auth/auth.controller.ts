import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RegisterMeterRequestDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /** Unified login for customers, technicians and admins. */
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.service.login(body.email, body.password, body.role);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.service.forgotPassword(body.email);
  }

  /** Customer self-registration (mobile app). */
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.service.register(body.name, body.email, body.password, body.meterId, body.address);
  }

  /** Register a customer and queue their water-meter request in one step. */
  @Post('register-meter-request')
  registerMeterRequest(@Body() body: RegisterMeterRequestDto) {
    return this.service.registerMeterRequest(body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  changePassword(@CurrentUser() user: any, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(user.sub, body.oldPassword, body.newPassword);
  }
}
