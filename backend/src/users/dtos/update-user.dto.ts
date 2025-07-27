import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsStrongPassword()
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsOptional()
  displayName: string;
}
