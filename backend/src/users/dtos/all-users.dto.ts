import { Expose, Type } from 'class-transformer';

import { ResponseUserDto } from './response-user.dto';

export class ResponseAllUsersDto {
  @Expose()
  @Type(() => ResponseUserDto)
  result: ResponseUserDto[];

  @Expose()
  totalPages: number;
}
