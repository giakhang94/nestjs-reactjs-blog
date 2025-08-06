import {
  Controller,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThumbnailService } from './thumbnail.service';
import { JwtGuard } from 'src/auth/guards/Jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetCurrentUser } from 'src/auth/decorators/GetCurrentUser.decorator';
import { UserPayload } from 'src/types';
import { ImageValidationPipe } from 'src/pipes/image-validation.pipe';

@Controller('thumbnail')
export class ThumbnailController {
  constructor(private thumbnailService: ThumbnailService) {}

  @Patch('/change/:postSlug')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  changeThumb(
    @Param('postSlug') postSlug: string,
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @GetCurrentUser() user: UserPayload,
  ) {
    return this.thumbnailService.updateThumbnail(file, user, postSlug);
  }
}
