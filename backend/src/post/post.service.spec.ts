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
import { BadRequestException } from '@nestjs/common';

describe('PostService', () => {
  let service: PostService;
  let cloudinary: { uploadFile: any; deleteFile: any };
  let prisma: { $transaction: ({ tx }: any) => any };
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
          },
        });
      }),
    };

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
  describe.only('createPost', () => {
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
});
