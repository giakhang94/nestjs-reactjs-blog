import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { comparePw } from 'src/utils/hassPassword';
import { attachToken } from './helpers/attach-token';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}
  async validateUser(email: string, password: string) {
    if (!email) console.log('can not work correctly without email');
    const user = await this.usersService.findUserByEmail(email);
    if (await comparePw(password, user.password)) {
      return user;
    } else {
      throw new BadRequestException('Email and password not match');
    }
  }

  async loginUser(user: User, response: Response) {
    const payload = { userId: user.id };
    const token = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      expiresIn:
        this.configService.getOrThrow('JWT_REFRESH_EXP') +
        this.configService.getOrThrow('JWT_TIME_UNIT'),
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
    });
    attachToken(
      'refresh',
      this.configService.getOrThrow('JWT_REFRESH_EXP'),
      refreshToken,
      response,
    );
    attachToken(
      'authentication',
      this.configService.getOrThrow('JWT_EXP'),
      token,
      response,
    );
    return user;
  }

  async logoutUser(response: Response) {
    attachToken('authentication', 0, '', response);
    return { message: 'logout successfully' };
  }

  async refreshToken(token: string, response: Response) {
    if (!token) {
      throw new UnauthorizedException('Please login to continue');
    }
    const payload = await this.jwt.verifyAsync(token, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
    });
    if (payload.exp * 1000 - Date.now() <= 0) {
      console.log('refresh token expired');
      throw new UnauthorizedException('Please login to continue');
    }
    const newAccessToken = this.jwt.sign({ userId: payload.userId });
    attachToken(
      'authentication',
      this.configService.getOrThrow('JWT_EXP'),
      newAccessToken,
      response,
    );
  }
}
