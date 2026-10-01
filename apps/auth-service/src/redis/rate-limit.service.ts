import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async hit(key: string, windowSeconds: number) {
    const count = await this.redis.incrWithTtl(`rl:${key}`, windowSeconds);
    const ttl = await this.redis.client.ttl(`rl:${key}`);
    return { count, retryAfter: ttl > 0 ? ttl : windowSeconds };
  }
}
