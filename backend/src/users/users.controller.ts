import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { User } from './user.entity';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@GetCurrentUser() user: Partial<User>) {
    return user;
  }
}
