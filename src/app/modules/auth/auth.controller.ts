import { Request, Response, NextFunction } from 'express';
import passport from '@lib/passport';
import * as authService from '@modules/auth/auth.service';
import { setAuthCookies, clearAuthCookies } from '@utils/authCookie';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { User } from '@/generated/prisma/client';

export const register = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, message: result.message, data: result });
});

export const verifyOtp = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({ success: true, message: 'Account created successfully', data: result });
});

export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: Error | null, user: User | null | undefined, info: any | null) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });

    const tokens = authService.issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ success: true, message: 'Login successful', data: { user: authService.safeUser(user), ...tokens } });
  })(req, res, next);
};

export const me = tryCatchAsync(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Current user profile', data: { user: authService.safeUser(req.user as User) } });
});

export const refresh = tryCatchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshTokens(req.cookies?.refreshToken || req.body?.refreshToken);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({ success: true, message: 'New tokens issued', data: tokens });
});

export const logout = tryCatchAsync(async (req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});
