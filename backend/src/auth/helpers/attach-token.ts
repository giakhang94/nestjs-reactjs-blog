import { Response } from 'express';

export const attachToken = (exp: number, token: string, res: Response) => {
  res.cookie('authentication', token, {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + exp * 60 * 60 * 1000),
  });
};
