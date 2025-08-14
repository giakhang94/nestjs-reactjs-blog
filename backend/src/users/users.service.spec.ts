import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
jest.mock('src/utils/hassPassword', () => {
  return {
    hashPw: jest.fn(),
  };
});
import * as passwordUtils from 'src/utils/hassPassword';
import { first } from 'rxjs';
import { User } from 'generated/prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { create: any; findUnique: any } };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe.only('createUser', () => {
    let mockUser: Partial<CreateUserDto>;
    beforeEach(() => {
      mockUser = {
        email: 'mock_email',
        password: 'mock_password',
        firstName: 'first',
        lastName: 'last',
      };

      jest.clearAllMocks();
    });
    it('should throw a BadRequestException if email has been already used', async () => {
      let mockResultUser = { email: 'mock_email', password: 'hashedPw' };

      prisma.user.findUnique.mockResolvedValue(mockResultUser);
      // khi mock resolved value thì không execute hàm đó
      // prisma.user.findUnique() <== wrong. Do not call this method!
      await expect(
        service.createUser(mockUser as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should concat the display name correctly', async () => {
      await service.createUser(mockUser as CreateUserDto);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayName: mockUser.firstName! + ' ' + mockUser.lastName!,
        }),
      });
    });
    it('should not concat when displayName is provided', async () => {
      mockUser.displayName = 'displayName_mock';
      await service.createUser(mockUser as CreateUserDto);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayName: 'displayName_mock',
        }),
      });
    });
    it('should hash the password correctly and return the correct User data', async () => {
      let mockHashedPassword = 'hashed Password';
      let mockResultUser = { email: 'mock_email', password: 'hashedPw' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockResultUser);

      (passwordUtils.hashPw as jest.Mock).mockResolvedValue(mockHashedPassword);
      const user = await service.createUser(mockUser as CreateUserDto);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: mockHashedPassword,
        }),
      });
      expect(user).toBeDefined();
    });
  });
});
