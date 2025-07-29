import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from 'src/types';
import { ResponseUserDto } from './response-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseAllUsersDto {
  @Expose()
  @Type(() => ResponseUserDto)
  result: ResponseUserDto[];

  @Expose()
  totalPages: number;
}
