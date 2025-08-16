import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UserPayload } from 'src/types';
import { Role } from 'src/types';
jest.mock('./helpers/create-unique-slug', () => {
  return {
    createUniqueSlug: jest.fn(),
  };
});
import * as createUniqueSlug from './helpers/create-unique-slug';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EditPostDto } from './dtos/edit-post.dto';

describe('PostService', () => {
  let mockUserPayload: UserPayload;
  let service: PostService;
  let cloudinary: { uploadFile: any; deleteFile: any };
  let prisma: {
    $transaction: ({ tx }: any) => any;
    post: { findMany: any; update: any; findUnique: any };
    category?: { findUnique: any };
  };
  let mockTagUpsert = jest.fn();
  let mockTagsOnPostUpsert = jest.fn();
  beforeEach(async () => {
    cloudinary = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    prisma = {
      $transaction: jest.fn((cb) => {
        return cb({
          post: {
            create: jest.fn(),
            findMany: jest.fn(),
          },
          tag: {
            upsert: jest.fn(),
          },
          tagsOnPosts: {
            upsert: jest.fn(),
          },
        });
      }),
      post: {
        findMany: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    };

    mockUserPayload = { userId: 1, role: Role.author } as UserPayload;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  //create post
  describe('createPost', () => {
    let body: CreatePostDto;
    let mockUserPayload: UserPayload;
    let mockCreatePost;
    let mockFile;
    beforeEach(() => {
      mockFile = { filename: 'tao.jpg' } as Express.Multer.File;
      body = {
        title: 'mock title',
        content: 'mock content',
        preview_text: 'mock preview text na',
        status: 'draft',
        category: 'mock',
        tags: JSON.stringify(['tag1', 'tag2']),
      };
      mockCreatePost = jest.fn().mockResolvedValue(body);
      mockUserPayload = { userId: 22, role: Role.author } as UserPayload;

      jest.clearAllMocks();
    });

    it('should create a unique slug', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb({
          post: {
            create: mockCreatePost,
          },
          thumbnail: {
            create: jest.fn().mockResolvedValue({
              public_id: 'mock id',
              url: 'http://',
              postId: 1,
            }),
          },
        });
      });
      (createUniqueSlug.createUniqueSlug as jest.Mock).mockResolvedValue(
        'unique slug',
      );
      (cloudinary.uploadFile as jest.Mock).mockResolvedValue({
        secure_url: 'abc',
        public_id: '1235',
      });

      const post = await service.createPost(body, mockUserPayload, mockFile);
      expect(mockCreatePost).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'unique slug',
        }),
      });
      expect(post).toBeDefined();
      expect(cloudinary.uploadFile).toHaveBeenCalledTimes(1);
      expect(cloudinary.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it('should rollback and delete uploaded file on cloudinary when something fails', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb({
          post: {
            create: jest.fn().mockRejectedValue(new BadRequestException()),
          },
        });
      });
      cloudinary.uploadFile.mockResolvedValue({
        public_id: '1235',
      });
      // (cloudinary.deleteFile as jest.Mock).mockResolvedValue('1235');
      await expect(
        service.createPost(body, mockUserPayload, mockFile),
      ).rejects.toThrow(BadRequestException);

      // expect(cloudinary.deleteFile).toHaveBeenCalledTimes(1);
      // expect(cloudinary.deleteFile).toHaveBeenCalledWith('1235');
      expect(cloudinary.deleteFile).toHaveBeenCalledWith('1235');
      expect(cloudinary.deleteFile).toHaveBeenCalledTimes(1);
    });
  });
  //get all posts
  describe('getAllPosts', () => {
    let mockSearch: string;
    let mockCategoryId: number;
    let tag: string;
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should contain OR clause in where object if search is not an empty string', async () => {
      mockSearch = 'mock search';
      const posts = await service.getAllPosts(
        mockSearch,
        null as any,
        null as any,
      );
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { content: { search: mockSearch } },
              { title: { search: mockSearch } },
            ],
          }),
        }),
      );
    });

    it('should contain tags query string in where object if tag is not empty', async () => {
      tag = 'tag_mock';
      const posts = await service.getAllPosts('tao', 1, tag);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                tag: {
                  tag: {
                    equals: tag,
                  },
                },
              },
            },
          }),
        }),
      );
    });

    it('should contain cateId query string in where object if categoryId is provided', async () => {
      mockCategoryId = 2;
      let mockResult = [{ id: 1 }, { id: 2 }];
      prisma.post.findMany.mockResolvedValue(mockResult);
      const posts = await service.getAllPosts('tao', mockCategoryId, tag);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cateId: mockCategoryId,
          }),
        }),
      );
      expect(posts).toBeDefined();
      expect(posts).toEqual(mockResult);
    });

    it('should find all post if there no param for query string', async () => {
      const posts = await service.getAllPosts(
        null as any,
        null as any,
        null as any,
      );
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });
  //update post
  describe.only('updatePost', () => {
    let body: EditPostDto;
    let currentSlug: string;
    beforeEach(() => {
      body = { title: 'test mock title', cateId: '220' };
      currentSlug = 'test-mock-title-1';
      prisma.post.findUnique.mockResolvedValue({ id: 2 });
      prisma.category?.findUnique.mockResolvedValue({ id: 1 });
      jest.clearAllMocks();
    });
    it('should throw new a NotFoundException if post with provided id is not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      expect(
        service.editPost(currentSlug, body, mockUserPayload),
      ).rejects.toThrow(NotFoundException);
    });
    it('should throw new BadRequestException when provided category have not created yet', async () => {
      prisma.category?.findUnique.mockResolvedValue(null);
      prisma.post.findUnique.mockResolvedValue({ id: 2 });
      expect(
        service.editPost(currentSlug, body, mockUserPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a new unique slug precisely when body.slug is provided', async () => {
      body.slug = 'test-update-mock-create-new-unique-slug';
      let mockNewSlug = body.slug + 1;
      (createUniqueSlug.createUniqueSlug as jest.Mock).mockResolvedValue(
        mockNewSlug,
      );
    });

    it('should update post correctly', async () => {
      body.tags = ['tag3', 'tag4'] as any;
      let currentTags = [
        { tag: 'tag1', id: 1 },
        { tag: 'tag2', id: 2 },
        { tag: 'tag3', id: 3 },
      ];
      let currentTagArr = currentTags.map((tag: any) => {
        return tag.tag;
      });
      let mockTagUpsert = jest
        .fn()
        .mockResolvedValue({ id: Math.ceil(Math.random() * 100) });
      let mockTagPostUpsert = jest.fn();
      let mockTagPostDelete = jest.fn();
      let mockPostUpdate = jest.fn();
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        return cb({
          tag: {
            upsert: mockTagUpsert,
          },
          tagsOnPosts: {
            upsert: mockTagPostUpsert,
            delete: mockTagPostDelete,
          },
          post: {
            update: mockPostUpdate,
          },
        });
      });
      prisma.post.findUnique.mockResolvedValue({
        tags: currentTags,
        id: 1,
      });
      let countNewTag = 0;
      let countRemoveTag = 0;
      (body.tags as any).map((tag: string) => {
        if (currentTagArr.includes(tag)) countNewTag++;
      });
      currentTagArr.map((tag: any) => {
        if (!body.tags!.includes(tag.tag)) {
          countRemoveTag++;
        }
      });
      const result = await service.editPost(currentSlug, body, mockUserPayload);
      expect(mockTagPostUpsert).toHaveBeenCalledTimes(countNewTag);
      expect(mockTagPostDelete).toHaveBeenCalledTimes(countRemoveTag);
    });
  });
});
