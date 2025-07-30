import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';

@Injectable()
export class AvatarService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}
  async uploadImage(file: Express.Multer.File, user: UserPayload) {
    const uploaded = await this.cloudinaryService.uploadFile(file);
    // console.log(uploaded);
    try {
      const avatar = await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.avatar.findUnique({
          where: { userId: user.userId },
        });
        if (existing) {
          const newAvatar = await transaction.avatar.update({
            where: { id: existing.id },
            data: { url: uploaded.secure_url, public_id: uploaded.public_id },
          });
          await this.cloudinaryService.deleteFile(existing.public_id);
          return newAvatar;
        } else {
          return transaction.avatar.create({
            data: {
              url: uploaded.secure_url,
              userId: user.userId,
              public_id: uploaded.public_id,
            },
          });
        }
      });
      return avatar;
    } catch (error) {
      await this.cloudinaryService.deleteFile(uploaded.public_id);
      throw new BadRequestException('cannot upload image');
    }
  }
}
