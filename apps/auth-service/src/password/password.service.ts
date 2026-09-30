import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordService {
  // OWASP-recommended argon2id baseline
  private readonly opts = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  } as const;

  private dummy?: Promise<string>;

  hash(plain: string) {
    return argon2.hash(plain, this.opts);
  }

  verify(plain: string, hash: string) {
    return argon2.verify(plain, hash).catch(() => false);
  }

  async verifyAgainstDummy(plain: string) {
    this.dummy ??= argon2.hash(randomBytes(16).toString(), this.opts);
    await this.verify(await this.dummy, plain);
  }
}
