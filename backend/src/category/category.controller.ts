import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { UserPayload } from 'src/types';

@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('all-cate')
  @UseGuards(JwtGuard)
  getAllCategories(@Query('search') search: string) {
    return this.categoryService.getAllCategories(search);
  }

  @Delete('delete/:id')
  @UseGuards(JwtGuard)
  deleteUser(@Param('id') id: string, @GetCurrentUser() user: UserPayload) {
    return this.categoryService.deleteCategory(id, user);
  }
}
