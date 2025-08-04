import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';
import { CreatePostDto } from './dtos/create-post.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import slugify from 'slugify';
import { createUniqueSlug } from './helpers/create-unique-slug';
import { Prisma } from '@prisma/client';

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

    const slug = body.slug
      ? body.slug
      : await createUniqueSlug(title, this.prisma);

    const data = {
      content,
      title,
      preview_text,
      user: { connect: { id: user.userId } },
      status,
      tags,
      slug,
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
      console.log(error);
      throw new BadRequestException('can not create post');
    }
  }

  async getAllPosts(search: string, categoryId: number, tag: string) {
    const where = {};
    if (search) {
      where['OR'] = [
        {
          content: {
            search,
          },
        },
        { title: { search } },
      ];
    }
    if (tag) {
      where['tags'] = {
        some: {
          tag: {
            tag: {
              equals: tag,
            },
          },
        },
      };
    }
    if (categoryId) {
      where['cateId'] = categoryId;
    }

    return this.prisma.post.findMany({
      include: { tags: true },
      where,
    });

    // return this.prisma.$queryRaw`
    // select * from Post
    // left join TagsOnPosts on Post.id = TagsOnPosts.postId
    // left join Tag on TagsOnPosts.tagId = Tag.id
    // where (
    //   ${
    //     search === null || !search
    //       ? `1=1`
    //       : `(Post.title LIKE concat('%', :search, '%'))
    //   OR (Post.content LIKE concat('%', :search, '%'))
    //   OR (Post.tag LIKE concat('%', :search, '%'))
    //   `
    //   }
    // )
    // And (
    //   ${categoryId === null || !categoryId ? `1=1` : `Post.cateId = ${categoryId}`}
    // )
    // `;
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('post not found');
    return post;
  }

  async deletePost(slug: string, user: UserPayload) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('post not found');
    if (post.userId !== user.userId && user.role !== 'admin')
      throw new ForbiddenException('You can not delete this post');
    return this.prisma.post.delete({ where: { slug } });
  }
}
