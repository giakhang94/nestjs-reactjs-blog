import { Controller, Get, Query } from '@nestjs/common';
import { TagService } from './tag.service';

@Controller('tag')
export class TagController {
  constructor(private tagService: TagService) {}
  @Get('all-tags')
  getAllTags(@Query('search') search: string) {
    return this.tagService.getAllTags(search);
  }
}
