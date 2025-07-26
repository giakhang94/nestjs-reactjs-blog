import {
  Body,
  Controller,
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
import { User } from 'src/users/user.entity';
import { HideResponsePassword } from 'src/interceptors/hide-password.interceptor';
import { ResponseUserDto } from 'src/users/dtos/response-user.dto';

@Controller('auth')
@UseInterceptors(new HideResponsePassword(ResponseUserDto))
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}
  @Post('register-user')
  registerUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Post('login')
  @UseGuards(LocalGuard)
  loginUser(
    @Body() body: LoginUserDto,
    @GetCurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginUser(user, response);
  }
}
