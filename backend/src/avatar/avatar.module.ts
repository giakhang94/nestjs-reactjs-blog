import { Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [AvatarService],
  controllers: [AvatarController],
  imports: [PrismaModule, CloudinaryModule],
})
export class AvatarModule {}
