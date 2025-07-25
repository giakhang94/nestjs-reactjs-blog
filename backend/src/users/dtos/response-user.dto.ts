import { Exclude, Expose } from 'class-transformer';

export class ResponseUserDto {
  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  displayName: string;

  @Exclude()
  password: string;
}
