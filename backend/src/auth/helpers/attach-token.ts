import { Response } from 'express';

export const attachToken = (
  name: string,
  exp: number,
  token: string,
  res: Response,
) => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + exp * 60 * 60 * 1000),
  });
};
