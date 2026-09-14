import { NextFunction, Request, Response } from 'express';
import { prisma } from '@lib/prisma';
import { verifyToken } from '@utils/jwt';
import { AppError } from '@utils/AppError';
import { tryCatchAsync } from '@utils/tryCatchAsync';


export const checkAuth = (...requiredRoles: string[]) => {
  return tryCatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // cookie first (browser), then "Authorization: Bearer <token>"
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization?.split(' ')[1]
        : req.headers.authorization;

    if (!token) throw new AppError(401, 'No authentication token provided');

    const verified = verifyToken(token);
    if (!verified.success) throw new AppError(401, 'Invalid or expired token');

    const user = await prisma.user.findUnique({ where: { id: verified.data.id } });
    if (!user || user.isDeleted) throw new AppError(401, 'Session expired, please log in again');
    if (user.status === 'BLOCKED') throw new AppError(403, 'Your account has been blocked');

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(
        403,
        `Access denied. Required role: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    req.user = user; // the FULL fresh user — controllers get id, role, category, areaId… everything
    next();
  });
};

export default checkAuth;