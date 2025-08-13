import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
jest.mock('src/utils/hassPassword', () => {
  return {
    comparePw: jest.fn(),
  };
});
import * as passwordUtils from 'src/utils/hassPassword';
describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findUserByEmail: any;
  };

  beforeEach(async () => {
    userService = {
      findUserByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        JwtService,
        { provide: UsersService, useValue: userService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    let mockUser = {
      id: 1,
      email: 'some email',
      password: 'some pw',
    };
    it('should throw not found exception if can not find User by email', async () => {
      userService.findUserByEmail.mockRejectedValue(
        new NotFoundException('user not found'),
      );

      await expect(
        service.validateUser('random email', 'random password'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return user when password is correct and user exists', async () => {
      (passwordUtils.comparePw as jest.Mock).mockResolvedValue(true);
      userService.findUserByEmail.mockResolvedValue(mockUser);

      const user = await service.validateUser('input email', 'input password');
      expect(user).toEqual(mockUser);
    });

    it('should throw new BadRequestException when password is not correct', async () => {
      userService.findUserByEmail.mockResolvedValue(mockUser);
      (passwordUtils.comparePw as jest.Mock).mockResolvedValue(false);
      await expect(
        service.validateUser('input email', 'input password'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
