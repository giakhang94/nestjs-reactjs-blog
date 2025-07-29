import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { Role, User } from 'generated/prisma';
import { HideResponsePassword } from 'src/interceptors/hide-password.interceptor';
import { ResponseUserDto } from './dtos/response-user.dto';
import { UserPayload } from 'src/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ResponseAllUsersDto } from './dtos/all-users.dto';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@GetCurrentUser() user: Partial<User>) {
    return user;
  }

  @Get('all')
  @UseInterceptors(new HideResponsePassword(ResponseAllUsersDto))
  @UseGuards(JwtGuard)
  @ApiOperation({ description: 'get all users, only admin can view all users' })
  @ApiOkResponse({
    schema: {
      example: {
        result: [
          {
            email: 'ngk.khang94@gmail.com',
            firstName: 'Khang',
            lastName: 'Nguyen',
            displayName: 'Khang Hy',
            role: 'admin',
          },
        ],
        totalPages: 1,
      },
    },
  })
  @ApiParam({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiParam({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiParam({
    name: 'filter',
    required: false,
    description: "filter by user's role",
    example: 'author',
  })
  @ApiParam({
    name: 'search',
    required: false,
    description: 'full tex search, search by displayName',
    example: 'Khang Hy',
  })
  getAllUser(
    @GetCurrentUser() user: UserPayload,
    @Query('page') page: string,
    @Query('search') search: string,
    @Query('filter') filter: Role,
    @Query('limit') limit: string,
  ) {
    return this.usersService.getAllUsers(
      user,
      Number(limit) || 1,
      Number(page) || 1,
      search,
      filter,
    );
  }

  @Patch('update/:id')
  @UseGuards(JwtGuard)
  @UseInterceptors(new HideResponsePassword(ResponseUserDto))
  @ApiOkResponse({
    description: 'update user successfully',
    schema: {
      example: {
        email: 'test@gmail.com',
        firstName: 'Khang',
        lastName: 'Nguyen',
        displayName: 'Huyen Diep',
        role: 'author',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'can not find user by the provided id',
    schema: {
      example: {
        message: 'user not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of the user that needs to be edited',
    example: 2,
  })
  updateUser(
    @GetCurrentUser() user: UserPayload,
    @Body() body: UpdateUserDto,
    @Param('id') id: string,
  ) {
    return this.usersService.updateUser(user, id, body);
  }
}
