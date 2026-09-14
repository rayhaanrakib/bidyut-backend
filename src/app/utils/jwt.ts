import jwt from 'jsonwebtoken';
import config from '@app/config';

export type JwtPayload = { id: string; role: string };

export const createAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions);

export const createRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions);


export function verifyToken(
  token: string,
): { success: true; data: JwtPayload } | { success: false; error: string } {
  try {
    return { success: true, data: jwt.verify(token, config.jwt.accessSecret) as JwtPayload };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Invalid token' };
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}