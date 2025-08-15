import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
jest.mock('src/utils/hassPassword', () => {
  return {
    hashPw: jest.fn(),
  };
});
import * as passwordUtils from 'src/utils/hassPassword';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { create: any; findUnique: any } };
  let mockUser = {
    id: 12,
    email: 'mock_email@email.com',
    password: 'hashed pw',
    firstName: 'Goku',
    lastName: 'Kakarot',
    role: 'author',
  };
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

  describe('createUser', () => {
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

  //find user by id
  describe('findUserByid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should throw a BadRequestException when id is missing', async () => {
      await expect(service.findUserById(0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a NotFoundException when can not find user by provided id ', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findUserById(1)).rejects.toThrow(NotFoundException);
    });

    it('should return the user when everything is fine', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const user = await service.findUserById(12);
      expect(user).toBeDefined();
      expect(user).toEqual(mockUser);
    });
  });
  //findUserByEmail
  describe.only('findUserByEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should throw a BadRequestException when email is not provided', async () => {
      expect(service.findUserByEmail('')).rejects.toThrow(BadRequestException);
    });
    it('should throw a NotFoundException when there is no user matches this email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(service.findUserByEmail('test@gmail.com')).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should return a user when everything is OK', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const user = await service.findUserByEmail('whatever');
      expect(user).toBeDefined();
      expect(user).toEqual(mockUser);
    });
  });
});
