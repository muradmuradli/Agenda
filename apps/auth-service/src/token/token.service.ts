import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  createPrivateKey,
  createPublicKey,
  KeyObject,
  randomUUID,
} from 'node:crypto';

import { calculateJwkThumbprint, exportJWK, JWK, SignJWT } from 'jose';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

@Injectable()
export class TokenService implements OnModuleInit {
  privateKey!: KeyObject;
  private kid!: string;
  private publicJwk!: JWK;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const pem = await readFile(
      this.configService.getOrThrow<string>('JWT_PRIVATE_KEY_PATH'),
      'utf-8',
    );

    this.privateKey = createPrivateKey(pem);
    const jwk = await exportJWK(createPublicKey(this.privateKey));
    // kid derived from the key itself: stable, no extra storage
    this.kid = await calculateJwkThumbprint(jwk);
    this.publicJwk = { ...jwk, kid: this.kid, use: 'sig', alg: 'RS256' };
  }

  get accessTtlSeconds(): number {
    return Number(this.configService.get('ACCESS_TOKEN_TTL_SECONDS') ?? 900);
  }

  signAccessToken(user: { id: string; role: string }): Promise<string> {
    return new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: 'RS256', kid: this.kid, typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(this.configService.getOrThrow<string>('JWT_ISSUER'))
      .setAudience(this.configService.getOrThrow<string>('JWT_AUDIENCE'))
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtlSeconds}s`)
      .setJti(randomUUID())
      .sign(this.privateKey);
  }

  getJwks() {
    return { keys: [this.publicJwk] };
  }
}
