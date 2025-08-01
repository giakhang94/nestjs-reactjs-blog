import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [PostService],
  controllers: [PostController],
  imports: [PrismaModule, CloudinaryModule],
})
export class PostModule {}
