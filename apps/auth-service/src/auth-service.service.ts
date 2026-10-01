import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from './generated/prisma/client.js';
import { PasswordService } from './password/password.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { LockoutService } from './redis/lockout.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly lockout: LockoutService,
  ) {}

  async register(email: string, password: string): Promise<void> {
    const passwordHash = await this.passwordService.hash(password);
    try {
      await this.prismaService.user.create({
        data: {
          email,
          passwordHash,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // duplicate email, stay silent
        return;
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    await this.lockout.assertNotLocked(email);

    const user = await this.prismaService.user.findUnique({ where: { email } });
    let ok = false;
    if (user) {
      ok = await this.passwordService.verify(user.passwordHash, password);
    } else {
      await this.passwordService.verifyAgainstDummy(password);
    }

    if (!user || !ok) {
      await this.lockout.recordFailure(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.lockout.reset(email);
    return user;
  }

  async updateRole(userId: string, role: Role) {
    try {
      const user = await this.prismaService.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, role: true }, // never return passwordHash
      });
      return user;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }
}
