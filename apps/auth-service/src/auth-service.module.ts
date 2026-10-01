import { Module } from '@nestjs/common';
import { AuthController } from './auth-service.controller.js';
import { AuthService } from './auth-service.service.js';
import { validateEnv } from './config/env.validation.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { PasswordService } from './password/password.service.js';
import { TokenService } from './token/token.service.js';
import { JwksController } from './token/jwks.controller.js';
import { RefreshTokenService } from './token/refresh-token.service.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/jwt-auth-guard.js';
import { RolesGuard } from './common/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    RefreshTokenService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [],
})
export class AuthServiceModule {}
