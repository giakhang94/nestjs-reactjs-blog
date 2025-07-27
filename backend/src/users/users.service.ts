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
import { checkValidId } from './helpers/checkValidId';
import { checkPermission } from './helpers/checkPermission';
import { checkExistingUser } from './helpers/checkExistingUser';

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
    const id = checkValidId(_id);
    await checkPermission(user, id, "you can not edit other user's data");
    await checkExistingUser(this.prisma, id);
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('Nothing to update');
    }
    return this.prisma.user.update({ where: { id }, data: body });
  }

  async deleteUser(user: UserPayload, _id: string) {
    const id = checkValidId(_id);
    checkPermission(user, id, 'You can not delete other user');
    await checkExistingUser(this.prisma, id);
    return this.prisma.user.delete({ where: { id } });
  }
}
