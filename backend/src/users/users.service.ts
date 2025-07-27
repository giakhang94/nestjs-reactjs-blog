import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import { hashPw } from 'src/utils/hassPassword';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'generated/prisma';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserPayload } from 'src/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async createUser(body: CreateUserDto) {
    if (!body.displayName) {
      body.displayName = body.firstName + ' ' + body.lastName;
    }
    body.password = await hashPw(body.password, 8);
    const user = await this.prisma.user.create({ data: body });
    return user;
  }

  async findUserById(id: number) {
    if (!id) {
      throw new BadRequestException('please provide user id');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async findUserByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('please provide user id');
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async getAllUsers(user: User) {
    console.log(user);
    if (user.role !== 'admin')
      throw new ForbiddenException('Only admin can view all users');
    return this.prisma.user.findMany();
  }

  async updateUser(user: UserPayload, _id: string, body: UpdateUserDto) {
    if (!Number(_id)) throw new BadRequestException('id must be a number!');
    const id = Number(_id);
    if (user.userId !== id && user.role !== 'admin') {
      throw new ForbiddenException("You can not update other user's data");
    }
    const checkUser = await this.prisma.user.findUnique({ where: { id } });
    if (!checkUser) {
      throw new NotFoundException('User not found');
    }
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('Nothing to update');
    }
    return this.prisma.user.update({ where: { id }, data: body });
  }
}
