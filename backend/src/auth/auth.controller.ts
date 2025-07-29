import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}
  @ApiOperation({
    description: 'Create user. Let the new user register their new account',
  })
  @ApiBadRequestResponse({
    description: 'email is in used',
    schema: {
      example: {
        message: 'Email has been already used',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'user creates account successfully',
    schema: {
      example: {
        email: 'test@gmail.com',
        firstName: 'Khang',
        lastName: 'Nguyen',
        displayName: 'test user',
        role: 'author',
      },
    },
  })
  @Post('register-user')
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  registerUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  @UseGuards(LocalGuard)
  @ApiOperation({ description: 'login user with provided email and password' })
  @ApiNotFoundResponse({
    description: 'can not find any user has the provided email',
    schema: {
      example: {
        message: 'user not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiOkResponse({
    description: 'user logged in successfully',
    schema: {
      example: {
        email: 'ngk.khang94@gmail.com',
        firstName: 'Khang',
        lastName: 'Nguyen',
        displayName: 'Khang Hy',
        role: 'admin',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'when email and password do not match',
    schema: {
      example: {
        message: 'Email and password not match',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async loginUser(
    @Body() body: LoginUserDto,
    @GetCurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginUser(user, response);
  }

  @Get('logout')
  @ApiOperation({
    description: 'logout user, remove access-token and revoke refresh-token',
  })
  @ApiOkResponse({
    description: 'user logged out successfully',
    schema: { example: { message: 'logout successfully' } },
  })
  async logoutUser(@Res({ passthrough: true }) response: Response) {
    return this.authService.logoutUser(response);
  }

  @Get('refresh-token')
  @ApiOperation({
    description:
      'when access token is expired and refresh-token is still valid',
  })
  @ApiUnauthorizedResponse({
    description: 'when refresh-token is null or undefined',
    schema: {
      example: { message: 'please login to continue' },
    },
  })
  @ApiBadRequestResponse({
    description: 'When refresh-token is expired',
    schema: { example: { message: 'please login to continue' } },
  })
  @ApiOkResponse({
    description:
      'when everything is ok, and the access token has been refreshed',
    schema: {
      example: { message: 'access-token refreshed' },
    },
  })
  async refreshToken(
    @GetRefreshToken() token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(token, response);
  }
}
