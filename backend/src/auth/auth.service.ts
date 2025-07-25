import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { comparePw } from 'src/utils/hassPassword';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  async validateUser(email: string, password: string) {
    if (!email) console.log('can not work correctly without email');
    const user = await this.usersService.findUserByEmail(email);
    if (await comparePw(password, user.password)) {
      return user;
    } else {
      throw new BadRequestException('Email and password not match');
    }
  }
}
