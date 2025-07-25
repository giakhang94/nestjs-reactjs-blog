import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dtos/login-user.dto';
import { LocalGuard } from './guards/Local.guard';

@Controller('auth')
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
  loginUser(@Body() body: LoginUserDto) {
    return this.authService.
  }
}
