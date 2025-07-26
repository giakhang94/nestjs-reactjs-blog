import { BadRequestException, Injectable } from '@nestjs/common';
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
    attachToken(this.configService.getOrThrow('JWT_EXP'), token, response);
    return user;
  }

  async logoutUser(response: Response) {
    attachToken(0, '', response);
    return { message: 'logout successfully' };
  }
}
