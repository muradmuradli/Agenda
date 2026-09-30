import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';
import { RegisterDto } from './dtos/register-dto.js';
import { LoginDto } from './dtos/login-dto.js';

@Controller('/auth')
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    await this.authServiceService.register(dto);
    return {
      message:
        'If the email can be registered, you will receive further instructions.',
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.authServiceService.login(dto);
    return { user_id: user.id };
  }
}
