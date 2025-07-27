import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dtos/login-user.dto';
import { LocalGuard } from './guards/Local.guard';
import { Response } from 'express';
import { GetCurrentUser } from './decorators/GetCurrentUser.decorator';

import { HideResponsePassword } from 'src/interceptors/hide-password.interceptor';
import { ResponseUserDto } from 'src/users/dtos/response-user.dto';
import { JwtGuard } from './guards/Jwt.guard';
import { GetRefreshToken } from './decorators/get-refresh-token.decorator';
import { User } from 'generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}
  @Post('register-user')
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  registerUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Post('login')
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  @UseGuards(LocalGuard)
  async loginUser(
    @Body() body: LoginUserDto,
    @GetCurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginUser(user, response);
  }

  @Get('logout')
  async logoutUser(@Res({ passthrough: true }) response: Response) {
    return this.authService.logoutUser(response);
  }

  @Get('refresh-token')
  async refreshToken(
    @GetRefreshToken() token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(token, response);
  }
}
