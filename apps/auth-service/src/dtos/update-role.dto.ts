import { Role } from '../generated/prisma/enums.js';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}
