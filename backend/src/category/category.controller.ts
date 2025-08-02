import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';

@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('all-cate')
  @UseGuards(JwtGuard)
  getAllCategories(@Query('search') search: string) {
    return this.categoryService.getAllCategories(search);
  }
}
