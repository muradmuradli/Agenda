import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private get ttlMs(): number {
    const days = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS') ?? 7);
    return days * 24 * 60 * 60 * 1000;
  }

  // db is either the normal client or a transaction client
  private async createToken(
    db: Prisma.TransactionClient,
    userId: string,
    familyId: string,
  ): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await db.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });
    return raw;
  }

  private async toPair(
    user: { id: string; role: Role },
    refreshToken: string,
  ): Promise<TokenPair> {
    return {
      accessToken: await this.tokenService.signAccessToken(user),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenService.accessTtlSeconds,
    };
  }

  // Login: start a brand-new family
  async issueForLogin(user: { id: string; role: Role }): Promise<TokenPair> {
    const raw = await this.createToken(
      this.prismaService,
      user.id,
      randomUUID(),
    );
    return this.toPair(user, raw);
  }

  async rotate(presented: string): Promise<TokenPair> {
    const invalid = () => new UnauthorizedException('Invalid refresh token');

    const stored = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: this.hash(presented) },
      include: { user: true },
    });
    if (!stored) throw invalid();
    if (stored.revokedAt) throw invalid();

    if (stored.usedAt) {
      // REUSE DETECTED: someone else holds a copy. Burn the whole session.
      await this.revokeFamily(stored.familyId);
      throw invalid();
    }
    if (stored.expiresAt <= new Date()) throw invalid();

    // Atomically claim the token: only one concurrent request can win.
    const next = await this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: stored.id, usedAt: null, revokedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      return this.createToken(tx, stored.userId, stored.familyId);
    });

    if (!next) {
      // lost the race: treat like reuse
      await this.revokeFamily(stored.familyId);
      throw invalid();
    }

    // stored.user comes fresh from the DB, so role changes apply here
    return this.toPair(stored.user, next);
  }

  // Logout this session only
  async logout(presented: string): Promise<void> {
    const stored = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: this.hash(presented) },
    });
    if (stored) await this.revokeFamily(stored.familyId);
  }

  // Logout every session of this user
  async logoutAll(presented: string): Promise<void> {
    const stored = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: this.hash(presented) },
    });
    if (!stored) return;
    await this.prismaService.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
