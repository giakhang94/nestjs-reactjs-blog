import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}
  async getAllTags(tag?: string) {
    let searchTag = {};
    if (tag) {
      searchTag['tag'] = { search: tag };
    }
    return this.prisma.tag.findMany({ where: searchTag });
  }
}
