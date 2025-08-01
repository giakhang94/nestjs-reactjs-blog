import {
  Body,
  Controller,
  Post,
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

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post('create')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  createPost(
    @Body() body: CreatePostDto,
    @GetCurrentUser() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.createPost(body, user, file);
  }
}
