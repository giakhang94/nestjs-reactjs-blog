import { Exclude, Expose, Transform } from 'class-transformer';
import { Avatar } from 'generated/prisma';
import { AvatarResponseDto } from 'src/avatar/dtos/avatar-response.dto';
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

  @Expose()
  @Transform(({ obj }) => {
    // console.log(obj);
    return obj.avatar.url || null;
  })
  avatar: { url: string };

  @Exclude()
  password: string;
}

// console.log(obj)
// {
//   id: 1,
//   email: 'ngk.khang94@gmail.com',
//   password: 'mypassword', (đã sửa tay từ pw gốc thành như vậy để không lộ thông tin)
//   firstName: 'Khang',
//   lastName: 'Nguyen',
//   displayName: 'Khang Hy',
//   role: 'admin',
//   createdAt: 2025-07-30T16:51:22.366Z,
//   updatedAt: 2025-07-30T16:51:22.366Z,
//   avatar: {
//     id: 2,
//     url: 'https://res.cloudinary.com/doafhaufa/image/upload/v1753927492/cydchsf5bke0lxhrb2ww.png',
//     public_id: 'hidden_id', // đã hide (sửa tay) để không lộ thông tin
//     userId: 1
//   }
// }
