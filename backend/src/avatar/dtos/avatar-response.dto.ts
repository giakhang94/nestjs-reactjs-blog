import { Exclude, Expose } from 'class-transformer';

export class AvatarResponseDto {
  @Expose()
  url: string;

  @Exclude()
  public_id: string;
  @Exclude()
  userId: number;
  @Exclude()
  id: number;
}
