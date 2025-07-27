import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export const checkExistingUser = async (prisma: PrismaService, id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('user not found');
};
