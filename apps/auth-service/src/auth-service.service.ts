import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { PasswordService } from './password/password.service.js';
import { RegisterDto } from './dtos/register-dto.js';
import { Prisma, Role } from './generated/prisma/client.js';
import { LoginDto } from './dtos/login-dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    const passwordHash = await this.passwordService.hash(dto.password);
    try {
      await this.prismaService.user.create({
        data: {
          email: dto.email,
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

  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    let ok = false;

    if (user) {
      ok = await this.passwordService.verify(user.passwordHash, dto.password);
    } else {
      await this.passwordService.verifyAgainstDummy(dto.password);
    }

    if (!user || !ok) {
      throw new UnauthorizedException('Invalid credentials!');
    }

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
