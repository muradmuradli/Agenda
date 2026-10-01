import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPrivateKey,
  createPublicKey,
  KeyObject,
  randomUUID,
} from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  calculateJwkThumbprint,
  exportJWK,
  JWK,
  jwtVerify,
  JWTPayload,
  SignJWT,
} from 'jose';

@Injectable()
export class TokenService implements OnModuleInit {
  private privateKey!: KeyObject;
  private publicKey!: KeyObject;
  private kid!: string;
  private publicJwk!: JWK;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const pem = await readFile(
      this.config.getOrThrow<string>('JWT_PRIVATE_KEY_PATH'),
      'utf8',
    );
    this.privateKey = createPrivateKey(pem);
    this.publicKey = createPublicKey(this.privateKey);
    const jwk = await exportJWK(this.publicKey);
    this.kid = await calculateJwkThumbprint(jwk);
    this.publicJwk = { ...jwk, kid: this.kid, use: 'sig', alg: 'RS256' };
  }

  get accessTtlSeconds(): number {
    return Number(this.config.get('ACCESS_TOKEN_TTL_SECONDS') ?? 900);
  }

  signAccessToken(user: { id: string; role: string }): Promise<string> {
    return new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: 'RS256', kid: this.kid, typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(this.config.getOrThrow<string>('JWT_ISSUER'))
      .setAudience(this.config.getOrThrow<string>('JWT_AUDIENCE'))
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtlSeconds}s`)
      .setJti(randomUUID())
      .sign(this.privateKey);
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
      audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      clockTolerance: '5s',
    });
    return payload;
  }

  getJwks() {
    return { keys: [this.publicJwk] };
  }
}
