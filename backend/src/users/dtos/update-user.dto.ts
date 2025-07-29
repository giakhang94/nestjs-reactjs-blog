import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({ example: 'khang@gmail.com' })
  email: string;

  @IsStrongPassword()
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'StrongPassword@2025' })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Gia Khang' })
  firstName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Nguyen' })
  lastName: string;

  @IsOptional()
  @ApiProperty({ example: 'Huyen Diep' })
  displayName: string;
}
