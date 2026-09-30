import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @MaxLength(128)
  email!: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
