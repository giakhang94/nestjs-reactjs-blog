import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}
  async createCategory(category: string, user: UserPayload) {
    const checkExistingCate = await this.prisma.category.findUnique({
      where: { category },
    });
    if (checkExistingCate) {
      throw new BadRequestException(`${category} already exists`);
    }
    return this.prisma.category.create({
      data: { category },
    });
  }

  async getAllCategories(search?: string) {
    let searchObject = {};
    if (search) {
      searchObject['category'] = { search };
    }
    return this.prisma.category.findMany({ where: searchObject });
  }
}
