import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const INCR_WITH_TTL = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c
`;

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'));
  }

  /** Atomically increments a counter and starts its TTL on the first hit. */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    return (await this.client.eval(
      INCR_WITH_TTL,
      1,
      key,
      ttlSeconds,
    )) as number;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
