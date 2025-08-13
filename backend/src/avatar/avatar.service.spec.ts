import { Test, TestingModule } from '@nestjs/testing';
import { AvatarService } from './avatar.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BadRequestException, UploadedFile } from '@nestjs/common';
import { UserPayload } from 'src/types';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

describe('AvatarService', () => {
  let avatarService: AvatarService;
  let prisma: { $transaction: ({ tx }: any) => any };
  let cloudinary: Partial<CloudinaryService>;

  const mockUploadResult = {
    secure_url: 'http://cloudinary.com/test.jpg',
    public_id: 'public_id_123',
  };

  const mockUser = { userId: 1, role: 'admin' };
  const mockFile = { originalname: 'avatar.jpg' } as Express.Multer.File;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => {
        return cb({
          avatar: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        });
      }),
    };

    cloudinary = {
      uploadFile: jest.fn().mockResolvedValue(mockUploadResult),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    avatarService = module.get<AvatarService>(AvatarService);
  });

  it('should be defined', () => {
    expect(avatarService).toBeDefined();
  });

  it('should upload and update avatar if user already has one', async () => {
    const existingAvatar = {
      id: 12,
      userId: mockUser.userId,
      url: 'old_url',
      public_id: 'old_public_id',
    };

    const updatedAvatar = {
      ...existingAvatar,
      url: mockUploadResult.secure_url,
      public_id: mockUploadResult.public_id,
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      return cb({
        avatar: {
          findUnique: jest.fn().mockResolvedValue(existingAvatar),
          update: jest.fn().mockResolvedValue(updatedAvatar),
        },
      });
    });

    const result = await avatarService.uploadImage(
      mockFile,
      mockUser as UserPayload,
    );
    expect(cloudinary.uploadFile).toHaveBeenCalledWith(mockFile);
    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      existingAvatar.public_id,
    );
    expect(result).toEqual(updatedAvatar);
  });
  it('should upload and create new avatar if user has none', async () => {
    const newAvatar = {
      id: 13,
      userId: mockUser.userId,
      url: 'new_url',
      public_id: 'new_public_id',
    };
    const mockFindUnique = jest.fn().mockResolvedValue(null);
    const mockCreate = jest.fn().mockResolvedValue(newAvatar);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return cb({
        avatar: {
          findUnique: mockFindUnique,
          create: mockCreate,
        },
      });
    });
    const result = await avatarService.uploadImage(
      mockFile,
      mockUser as UserPayload,
    );

    expect(cloudinary.uploadFile).toHaveBeenCalledWith(mockFile);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId: mockUser.userId },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        url: mockUploadResult.secure_url,
        public_id: mockUploadResult.public_id,
        userId: mockUser.userId,
      },
    });
    expect(result).toEqual(newAvatar);
  });
  it('should delete uploaded image and throw BadRequestException if DB transaction fails', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new BadRequestException('cannot upload image'),
    );

    await expect(
      avatarService.uploadImage(mockFile, mockUser as UserPayload),
    ).rejects.toThrow(BadRequestException);
    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      mockUploadResult.public_id,
    );
  });
});
