import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';
import { LoginDto } from './dtos/login-dto.js';
import { RefreshTokenDto } from './dtos/refresh-token.dto.js';
import { RegisterDto } from './dtos/register-dto.js';
import { RefreshTokenService } from './token/refresh-token.service.js';

@Controller('auth')
export class AuthServiceController {
  constructor(
    private readonly authServiceService: AuthServiceService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

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
    return this.refreshTokenService.issueForLogin(user);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenService.rotate(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.refreshTokenService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(@Body() dto: RefreshTokenDto) {
    await this.refreshTokenService.logoutAll(dto.refreshToken);
  }
}
