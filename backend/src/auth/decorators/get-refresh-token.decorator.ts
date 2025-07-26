import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetRefreshToken = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies!['refresh'];
    return refreshToken;
  },
);
