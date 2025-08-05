import { Status } from 'generated/prisma';

export class EditPostDto {
  title?: string;
  status?: Status;
  preview_text?: string;
  content?: string;
  category?: string;
  tags?: string;
  slug?: string;
}
