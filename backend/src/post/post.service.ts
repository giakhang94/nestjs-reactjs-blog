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
import { EditPostDto } from './dtos/edit-post.dto';
import { checkValidId } from 'src/users/helpers/checkValidId';
import { equals } from 'class-validator';

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
      include: {
        tags: { include: { tag: { select: { tag: true } } } },
        category: true,
      },
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
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: { tags: { include: { tag: true } }, category: true },
    });
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

  async editPost(currentSlug: string, body: EditPostDto, user: UserPayload) {
    const post = await this.prisma.post.findUnique({
      where: { slug: currentSlug },
      include: { tags: { include: { tag: true } }, category: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    //check valid cateId
    let cateId: number;
    if (body.cateId) {
      cateId = checkValidId(body.cateId);
      const cate = await this.prisma.category.findUnique({
        where: { id: cateId },
      });
      if (!cate)
        throw new BadRequestException('Please create this category first');
    }

    //unique slug
    let slug = '';
    if (body.slug) slug = await createUniqueSlug(body.slug, this.prisma);
    //tags
    const currentTags = post.tags.map((tag: any) => {
      return tag.tag;
    });
    const newTags = body.tags as any;

    try {
      const updatePost = await this.prisma.$transaction(async (transaction) => {
        //add and connect new tags to the post
        await Promise.all(
          newTags.map(async (tag: string) => {
            if (!currentTags.includes(tag)) {
              const newTagRecord = await transaction.tag.upsert({
                where: { tag: tag },
                update: {},
                create: { tag: tag },
              });

              //connect tag and post
              await transaction.tagsOnPosts.upsert({
                where: {
                  postId_tagId: { postId: post.id, tagId: newTagRecord.id },
                },
                update: {},
                create: { tagId: newTagRecord.id, postId: post.id },
              });
            }
          }),
        );

        // remove (disconnect) tags
        await Promise.all(
          currentTags.map(async (tag: any) => {
            if (!newTags.includes(tag.tag)) {
              await transaction.tagsOnPosts.delete({
                where: {
                  postId_tagId: {
                    postId: post.id,
                    tagId: tag.id,
                  },
                },
              });
            }
          }),
        );
        await transaction.post.update({
          where: { slug: currentSlug },
          data: { ...body, slug: slug, tags: undefined, cateId },
        });
      });

      return updatePost;
    } catch (error) {
      console.log(error);
    }
  }

  async getPostByUser(
    _userId: string,
    search: string,
    tag: string,
    categoryId: string,
  ) {
    console.log(typeof _userId);
    const userId = checkValidId(_userId);
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) throw new NotFoundException('User not found');

    const where = { userId: userId };
    if (search) {
      where['OR'] = [{ title: { search } }, { content: { search } }];
    }
    if (categoryId) {
      const cateId = checkValidId(categoryId);
      where['cateId'] = cateId;
    }
    if (tag) {
      where['tags'] = { some: { tag: { tag: { equals: tag } } } };
    }
    return await this.prisma.post.findMany({
      where,
      include: { tags: true, category: true, thumbnail: true },
    });
  }
}
