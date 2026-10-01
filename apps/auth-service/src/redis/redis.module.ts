import { Module } from '@nestjs/common';
import { LockoutService } from './lockout.service.js';
import { RateLimitService } from './rate-limit.service.js';
import { RedisService } from './redis.service.js';

@Module({
  providers: [RedisService, RateLimitService, LockoutService],
  exports: [RateLimitService, LockoutService],
})
export class RedisModule {}
