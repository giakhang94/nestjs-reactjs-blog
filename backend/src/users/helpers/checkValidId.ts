import { BadRequestException } from '@nestjs/common';

export const checkValidId = (id: string) => {
  if (!Number(id)) {
    throw new BadRequestException('id must be a number');
  }
  return Number(id);
};
