import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { User } from 'generated/prisma';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@GetCurrentUser() user: Partial<User>) {
    return user;
  }

  @Get('all')
  @UseGuards(JwtGuard)
  getAllUser(@GetCurrentUser() user: User) {
    return this.usersService.getAllUsers(user);
  }
}
