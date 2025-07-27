import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import { hashPw } from 'src/utils/hassPassword';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
