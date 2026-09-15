import { Response } from 'express';
import config from '@app/config';

const baseOptions = {
  httpOnly: true,
  secure: config.server.isProduction,
  sameSite: (config.server.isProduction ? 'none' : 'lax') as 'none' | 'lax',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, { ...baseOptions, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
  res.cookie('refreshToken', refreshToken, { ...baseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', baseOptions);
}