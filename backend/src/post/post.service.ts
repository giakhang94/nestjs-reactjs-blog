import { BadRequestException, Injectable } from '@nestjs/common';
import { Status } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';
import { CreatePostDto } from './dtos/create-post.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async createPost(
    body: CreatePostDto,
    user: UserPayload,
    file: Express.Multer.File,
  ) {
    const { content, title, preview_text, status, category, tags } = body;
    const data = {
      content,
      title,
      preview_text,
      user: { connect: { id: user.userId } },
      status,
      tags,
    };
    const uploadedImage = await this.cloudinary.uploadFile(file);
    const categoryQuery = {
      connectOrCreate: {
        where: { category },
        create: { category },
      },
    };

    const tagsQuery = JSON.parse(tags).map((tag: string) => {
      return {
        tag: {
          connectOrCreate: {
            where: { tag },
            create: { tag },
          },
        },
      };
    });
    try {
      const newPost = await this.prisma.$transaction(async (transaction) => {
        const post = await transaction.post.create({
          data: {
            ...data,
            tags: { create: tagsQuery },
            category: categoryQuery,
          },
        });
        await transaction.thumbnail.create({
          data: {
            public_id: uploadedImage.public_id,
            // url: 111 as any, test rollback
            url: uploadedImage.secure_url,
            postId: post.id,
          },
        });
        return post;
      });
      return newPost;
    } catch (error) {
      this.cloudinary.deleteFile(uploadedImage.public_id);
      throw new BadRequestException('Cannot create post');
    }
  }
}
