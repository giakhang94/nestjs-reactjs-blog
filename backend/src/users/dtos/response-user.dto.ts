import { Exclude, Expose } from 'class-transformer';
import { Role } from 'src/types';

export class ResponseUserDto {
  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  displayName: string;

  @Expose()
  role: Role;

  @Exclude()
  password: string;
}
