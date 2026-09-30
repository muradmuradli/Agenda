import { Controller, Get, Header } from '@nestjs/common';
import { TokenService } from './token.service.js';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('jwks.json')
  @Header('Cache-Control', 'public, max-age=300')
  jwks() {
    return this.tokenService.getJwks();
  }
}
