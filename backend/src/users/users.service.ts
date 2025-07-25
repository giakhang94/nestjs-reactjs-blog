import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { hashPw } from 'src/utils/hassPassword';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}
  async createUser(body: CreateUserDto) {
    if (!body.displayName) {
      body.displayName = body.firstName + ' ' + body.lastName;
    }
    body.password = await hashPw(body.password, 8);
    const user = this.usersRepo.create(body);
    await this.usersRepo.save(user);
    return user;
  }
}
