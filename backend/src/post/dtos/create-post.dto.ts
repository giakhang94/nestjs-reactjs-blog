import { Status } from 'generated/prisma';

export class CreatePostDto {
  title: string;
  status: Status;
  preview_text: string;
  content: string;
  category: string;
  tags: string;
}
