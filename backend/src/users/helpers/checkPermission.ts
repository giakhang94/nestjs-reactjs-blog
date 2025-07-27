import { ForbiddenException } from '@nestjs/common';
import { UserPayload } from 'src/types';

export function checkPermission(
  user: UserPayload,
  id: number,
  message: string,
) {
  if (user.userId !== id && user.role !== 'admin') {
    throw new ForbiddenException(message);
  }
}
