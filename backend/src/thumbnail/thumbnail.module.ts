import { Module } from '@nestjs/common';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailController } from './thumbnail.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [ThumbnailService],
  controllers: [ThumbnailController],
  imports: [PrismaModule, CloudinaryModule],
})
export class ThumbnailModule {}
