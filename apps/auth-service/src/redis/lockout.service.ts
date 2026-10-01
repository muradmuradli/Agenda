import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { RedisService } from './redis.service.js';

const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60;

@Injectable()
export class LockoutService {
  constructor(private readonly redis: RedisService) {}

  // hash the email so raw addresses never appear in Redis keys or MONITOR output
  private key(email: string): string {
    return `login_fail:${createHash('sha256').update(email).digest('hex')}`;
  }

  async assertNotLocked(email: string): Promise<void> {
    const value = await this.redis.client.get(this.key(email));
    if (value !== null && Number(value) >= MAX_FAILURES) {
      throw new HttpException(
        'Too many failed attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailure(email: string): Promise<void> {
    await this.redis.incrWithTtl(this.key(email), WINDOW_SECONDS);
  }

  async reset(email: string): Promise<void> {
    await this.redis.client.del(this.key(email));
  }
}
