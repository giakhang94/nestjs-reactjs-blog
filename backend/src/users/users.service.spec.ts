import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  Body,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
jest.mock('src/utils/hassPassword', () => {
  return {
    hashPw: jest.fn(),
  };
});
import * as passwordUtils from 'src/utils/hassPassword';
import { Role, Role_filter, UserPayload } from 'src/types';
import { UpdateUserDto } from './dtos/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: any;
      findUnique: any;
      findMany: any;
      count: any;
      update: any;
    };
  };
  let mockUserPayload = {
    userId: 1333,
    role: Role.author,
  };
  let mockUser = {
    id: 1333,
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
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
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
  describe('findUserByEmail', () => {
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
  //get all users
  describe('getAllUser', () => {
    let mockUser: Partial<UserPayload>;
    let limit: number;
    let page: number;
    let search: string;
    let filter: Role_filter;
    beforeEach(() => {
      mockUser = {
        userId: 1,
        role: Role.admin,
      };
      limit = 3;
      page = 1;
      ((search = ''), (filter = Role_filter.all));

      jest.clearAllMocks();
    });
    it('should throw a ForbiddenException if user is not the admin', async () => {
      mockUser.role = Role.author;
      expect(
        service.getAllUsers(
          mockUser as UserPayload,
          limit,
          page,
          search,
          filter,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('should throw a BadRequestException if filter gets an unexpected value', async () => {
      filter = 'tao' as any;
      await expect(
        service.getAllUsers(
          mockUser as UserPayload,
          limit,
          page,
          search,
          filter,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should find all related users and return a correct value', async () => {
      let mockResultValue = [mockUser];
      let count = 5;
      prisma.user.count.mockResolvedValue(count);
      prisma.user.findMany.mockResolvedValue(mockResultValue);
      const expectedTotalPages = Math.ceil(count / limit);
      const result = await service.getAllUsers(
        mockUser as UserPayload,
        limit,
        page,
        search,
        filter,
      );

      expect(result).toBeDefined();
      expect(result).toEqual({
        result: mockResultValue,
        totalPages: expectedTotalPages,
      });
    });
  });
  //update user
  describe.only('updateUser', () => {
    let mockBody: UpdateUserDto;
    beforeEach(() => {
      mockBody = { email: 'mockEmail' } as UpdateUserDto;
      jest.clearAllMocks();
    });
    it('should throw a BadRequestException when provided id can not convert to number', async () => {
      await expect(
        service.updateUser(mockUserPayload as UserPayload, 'tao', mockBody),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw a ForbiddenException when user try to edit other's profile and he is not an admin", async () => {
      await expect(
        service.updateUser(mockUserPayload as UserPayload, '1', mockBody),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw a NotFoundException when user do not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateUser(mockUserPayload as UserPayload, '1333', mockBody),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the updated user correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        email: mockBody.email,
      });
      const user = await service.updateUser(
        mockUserPayload as UserPayload,
        '1333',
        mockBody,
      );

      expect(user).toBeDefined();
      expect(user).toEqual({ ...mockUser, email: mockBody.email });
    });
  });
});
