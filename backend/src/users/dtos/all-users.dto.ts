import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from 'src/types';
import { ResponseUserDto } from './response-user.dto';

export class ResponseAllUsersDto {
  @Expose()
  @Type(() => ResponseUserDto)
  result: ResponseUserDto[];

  @Expose()
  totalPages: number;
}
