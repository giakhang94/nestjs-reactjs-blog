import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import { hashPw } from 'src/utils/hassPassword';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from 'generated/prisma';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserPayload } from 'src/types';
import { checkValidId } from './helpers/checkValidId';
import { checkPermission } from './helpers/checkPermission';
import { checkExistingUser } from './helpers/checkExistingUser';
import { skip } from 'node:test';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async createUser(body: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (user) throw new BadRequestException('Email has been already used');
    if (!body.displayName) {
      body.displayName = body.firstName + ' ' + body.lastName;
    }
    body.password = await hashPw(body.password, 8);
    return this.prisma.user.create({ data: body });
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

  async getAllUsers(
    user: UserPayload,
    limit: number,
    page: number,
    search: string,
    filter: Role,
  ) {
    if (user.role !== 'admin')
      throw new ForbiddenException('Only admin can view all users');

    if (!Object.values(Role).includes(filter))
      throw new BadRequestException('Role must be admin or author');

    const skip = (page - 1) * limit;

    const result = await this.prisma.user.findMany({
      take: limit,
      skip,
      where: { displayName: { search }, role: filter },
      include: { avatar: true },
    });
    const count = await this.prisma.user.count();
    const totalPages = Math.ceil(count / limit);

    return { result, totalPages };
  }

  async updateUser(user: UserPayload, _id: string, body: UpdateUserDto) {
    const id = checkValidId(_id);
    checkPermission(user, id, "you can not edit other user's data");
    await checkExistingUser(this.prisma, id);
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('Nothing to update');
    }
    return this.prisma.user.update({ where: { id }, data: body });
  }

  async deleteUser(user: UserPayload, _id: string) {
    const id = checkValidId(_id);
    checkPermission(user, id, 'You can not delete other user');
    const checkUser = await this.prisma.user.findUnique({ where: { id } });
    if (!checkUser) throw new NotFoundException('user not found');
    await checkExistingUser(this.prisma, id);
    return this.prisma.user.delete({ where: { id } });
  }
}
