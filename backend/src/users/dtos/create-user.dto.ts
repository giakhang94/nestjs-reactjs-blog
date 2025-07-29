import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'khang@gmail.com',
  })
  email: string;

  @IsStrongPassword()
  @IsString()
  @ApiProperty({
    description: 'Strong password is required',
    example: 'Goku@1993',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'user first name',
    example: 'Gia Khang',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'user last name', example: 'Nguyen' })
  lastName: string;

  @IsOptional()
  @ApiProperty({
    description: 'optional, default value is $firstName + $lastName',
    default: 'Gia Khang Nguyen',
    example: 'Khang Hy',
  })
  displayName: string;
}
