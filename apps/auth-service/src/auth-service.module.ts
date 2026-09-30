import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller.js';
import { AuthServiceService } from './auth-service.service.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { PasswordService } from './password/password.service.js';
import { TokenService } from './token/token.service.js';
import { JwksController } from './token/jwks.controller.js';
import { RefreshTokenService } from './token/refresh-token.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AuthServiceController, JwksController],
  providers: [
    AuthServiceService,
    PasswordService,
    TokenService,
    RefreshTokenService,
  ],
  exports: [],
})
export class AuthServiceModule {}
