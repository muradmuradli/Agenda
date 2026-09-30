import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module.js';
import { ConfigService } from '@nestjs/config';
import { Env } from './config/env.validation.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
