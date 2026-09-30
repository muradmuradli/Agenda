import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @MaxLength(128)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
