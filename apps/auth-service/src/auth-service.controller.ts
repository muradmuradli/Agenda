import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth-service.service.js';
import { LoginDto } from './dtos/login-dto.js';
import { RefreshTokenDto } from './dtos/refresh-token.dto.js';
import { RegisterDto } from './dtos/register-dto.js';
import { RefreshTokenService } from './token/refresh-token.service.js';
import { Public } from './common/public.decorator.js';
import { CurrentUser } from './common/current-user.decorator.js';
import type { AuthUser } from './common/auth-user.js';
import { Roles } from './common/roles.decorator.js';
import { UpdateRoleDto } from './dtos/update-role.dto.js';
import { Role } from './generated/prisma/enums.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(202)
  async register(@Body() dto: RegisterDto) {
    await this.auth.register(dto);
    return {
      message:
        'If the email can be registered, you will receive further instructions.',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.login(dto);
    return this.refreshTokens.issueForLogin(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokens.rotate(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.refreshTokens.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(@CurrentUser() user: AuthUser) {
    await this.refreshTokens.logoutAll(user.id);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { id: user.id, role: user.role };
  }

  @Roles(Role.ADMIN)
  @Patch('users/:id/role')
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.auth.updateRole(id, dto.role);
  }
}
