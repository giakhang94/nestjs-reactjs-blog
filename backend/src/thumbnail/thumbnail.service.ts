import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';

@Injectable()
export class ThumbnailService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}
  async updateThumbnail(
    file: Express.Multer.File,
    user: UserPayload,
    postSlug: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { slug: postSlug },
      include: { thumbnail: true },
    });
    if (!post) throw new NotFoundException('post not found');
    if (user.userId !== post.userId && user.role !== 'admin')
      throw new ForbiddenException('You can not change this picture');

    //upload to cloudinary
    const uploaded = await this.cloudinary.uploadFile(file);
    try {
      const updatedImage = await this.prisma.$transaction(async (tx) => {
        const newThumb = await this.prisma.thumbnail.create({
          data: {
            postId: post.id,
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
          },
        });

        if (newThumb)
          await this.cloudinary.deleteFile(post.thumbnail?.public_id!);
      });
      return updatedImage;
    } catch (error) {
      await this.cloudinary.deleteFile(uploaded.public_id);
      throw new BadRequestException('Can not update this image');
    }
  }
}
