import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayload } from 'src/types';
import { checkValidId } from 'src/users/helpers/checkValidId';

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

  async deleteCategory(_id: string, user: UserPayload) {
    const id = checkValidId(_id);
    if (user.role !== 'admin') {
      throw new ForbiddenException('only admin can delete categories');
    }
    const cate = await this.prisma.category.findUnique({ where: { id } });
    if (!cate) throw new NotFoundException('category not found');
    const postsUsingThisCate = await this.prisma.post.count({
      where: { cateId: id },
    });
    if (postsUsingThisCate > 0) {
      throw new BadRequestException('This category is still in use by posts');
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
