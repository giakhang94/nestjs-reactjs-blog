import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { UserPayload } from 'src/types';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from 'src/pipes/image-validation.pipe';
import { EditPostDto } from './dtos/edit-post.dto';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post('create')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  createPost(
    @Body() body: CreatePostDto,
    @GetCurrentUser() user: UserPayload,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
  ) {
    return this.postService.createPost(body, user, file);
  }

  @Get('all-post')
  getAllPosts(
    @Query('search') search: string,
    @Query('categoryId') categoryId: string,
    @Query('tag') tag: string,
  ) {
    return this.postService.getAllPosts(search, Number(categoryId), tag);
  }

  @Get(':slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.postService.getPostBySlug(slug);
  }

  @Delete('delete/:slug')
  @UseGuards(JwtGuard)
  deletePost(@Param('slug') slug: string, @GetCurrentUser() user: UserPayload) {
    return this.postService.deletePost(slug, user);
  }

  @Patch('edit/:slug')
  @UseGuards(JwtGuard)
  editPost(
    @Body() body: EditPostDto,
    @Param('slug') slug: string,
    @GetCurrentUser() user: UserPayload,
  ) {
    return this.postService.editPost(slug, body, user);
  }

  @Get('user/:userId')
  getPostByUserId(
    @Param('userId') userId: string,
    @Query('search') search: string,
    @Query('tag') tag: string,
    @Query('categoryId') categoryId: string,
  ) {
    return this.postService.getPostByUser(userId, search, tag, categoryId);
  }
}
