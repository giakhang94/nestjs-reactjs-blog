import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { UserPayload } from 'src/types';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';

@Controller('avatar')
export class AvatarController {
  constructor(private avatarService: AvatarService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('avatar'))
  @UseGuards(JwtGuard)
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser() user: UserPayload,
  ) {
    return this.avatarService.uploadImage(file, user);
  }
}
