import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
jest.mock('src/utils/hassPassword', () => {
  return {
    comparePw: jest.fn(),
  };
});
import * as passwordUtils from 'src/utils/hassPassword';
import { response, Response } from 'express';
import { attachToken } from './helpers/attach-token';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findUserByEmail: any;
  };
  let jwtService: {
    sign: any;
    verify: any;
    verifyAsync: any;
  };
  let configService: jest.Mocked<ConfigService>;
  let resMock: jest.Mocked<Response>;

  beforeEach(async () => {
    userService = {
      findUserByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        { provide: JwtService, useValue: jwtService },
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
  describe('loginUser, logoutU ser', () => {
    const mock_token = 'mock_token as a string';
    beforeEach(async () => {
      configService = {
        getOrThrow: jest.fn((key: string) => {
          const fakeConfig = {
            JWT_REFRESH_EXP: 1,
            JWT_TIME_UNIT: 'h',
            JWT_REFRESH_SECRET: 'refresh_secret',
            JWT_EXP: 1,
          } as any;
          return fakeConfig[key];
        }),
      } as any;
      jwtService.sign.mockReturnValue(mock_token);
      resMock = { cookie: jest.fn() } as any;

      jest.clearAllMocks();
    });

    it('should sign tokens and set cookies', async () => {
      const fakeUser = { id: 123, role: 'admin' } as any;
      const result = await service.loginUser(fakeUser, resMock);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(resMock.cookie).toHaveBeenCalledWith(
        'refresh',
        mock_token,
        expect.any(Object),
      );
      expect(resMock.cookie).toHaveBeenCalledWith(
        'authentication',
        mock_token,
        expect.any(Object),
        //expect.any(Object) => check những phần còn lại là Object là được
        // để k bỏ sót đối số, nhưng đối số đó k qtrong nên k  cần ghi rõ, thfi dùng expect.any
      );
      expect(result).toEqual(fakeUser);
    });

    it('should logout user by attaching empty value tokens to cookie', async () => {
      let empty_token = '';
      // let expire_time = 0;
      const result = await service.logoutUser(resMock);

      expect(result).toEqual({ message: 'logout successfully' });
      expect(resMock.cookie).toHaveBeenCalledTimes(2);
      expect(resMock.cookie).toHaveBeenCalledWith(
        'authentication',
        empty_token,
        expect.any(Object),
      );
      expect(resMock.cookie).toHaveBeenCalledWith(
        'refresh',
        empty_token,
        expect.any(Object),
      );
    });
  });

  describe.only('refresh token', () => {
    beforeEach(() => {
      resMock = { cookie: jest.fn() } as any;

      jest.clearAllMocks();
    });
    it('should throw new UnauthorizedException if token is falsy', async () => {
      await expect(service.refreshToken('', resMock)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw new UnauthorizedException when token is expires', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        userId: 1,
        role: 'admin',
        exp: 0,
      });
      await expect(service.refreshToken('mock_token', resMock)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call jwt.sign and attachToken correctly', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        userId: 1,
        role: 'admin',
        exp: Date.now() + 1000 * 60 * 60 * 24,
      });
      jwtService.sign.mockReturnValue('new access token');
      const result = await service.refreshToken('mock_token', resMock);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'mock_token',
        expect.any(Object),
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(resMock.cookie).toHaveBeenCalledWith(
        'authentication',
        'new access token',
        expect.any(Object),
      );

      expect(result).toEqual({ message: 'access-token refreshed' });
    });
  });
});
