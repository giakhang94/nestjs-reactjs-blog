import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { User } from 'generated/prisma';
import { HideResponsePassword } from 'src/interceptors/hide-password.interceptor';
import { ResponseUserDto } from './dtos/response-user.dto';
import { UserPayload } from 'src/types';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@GetCurrentUser() user: Partial<User>) {
    return user;
  }

  @Get('all')
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  @UseGuards(JwtGuard)
  getAllUser(@GetCurrentUser() user: User) {
    return this.usersService.getAllUsers(user);
  }

  @Patch('update/:id')
  @UseGuards(JwtGuard)
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  updateUser(
    @GetCurrentUser() user: UserPayload,
    @Body() body: UpdateUserDto,
    @Param('id') id: string,
  ) {
    return this.usersService.updateUser(user, id, body);
  }
}
