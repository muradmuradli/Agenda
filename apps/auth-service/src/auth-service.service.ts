import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { PasswordService } from './password/password.service.js';
import { RegisterDto } from './dtos/register-dto.js';
import { Prisma } from './generated/prisma/client.js';
import { LoginDto } from './dtos/login-dto.js';

@Injectable()
export class AuthServiceService {
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
}
