import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';

export const createUniqueSlug = async (
  title: string,
  prisma: PrismaService,
): Promise<string> => {
  const baseSlug = slugify(title, { lower: true });
  let slug = baseSlug;
  let count = 1;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count++}`;
  }
  return slug;
};
