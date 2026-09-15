import { Request, Response, NextFunction } from 'express';
import passport from '@lib/passport';
import * as authService from '@modules/auth/auth.service';
import { setAuthCookies, clearAuthCookies } from '@utils/authCookie';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { User } from '@/generated/prisma/client';
import config from '@app/config';

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


export const googleLogin = (req: Request, res: Response) => {
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(config.google.clientId)}` +
    `&redirect_uri=${encodeURIComponent(
      `${config.server.backendUrl}/api/v1/auth/google/callback`
    )}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('profile email')}`;

  return res.redirect(googleAuthUrl);
};

// Google redirects the real browser here — so WE redirect the browser on.
export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('Google login failed:', err?.message || info?.message);
      return res.redirect(`${config.server.frontendUrl}/login?error=google_failed`);
    }
    const tokens = authService.issueTokens(user);
    const googleIdToken = req.googleIdToken;
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, googleIdToken);
    const fragment = `#accessToken=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}${googleIdToken ? `&idToken=${encodeURIComponent(googleIdToken)}` : ''}`;
    res.redirect(`${config.server.frontendUrl}/oauth/success${fragment}`);
  })(req, res, next);
};


export const forgotPassword = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  res.json({ success: true, message: result.message });
});

export const resetPassword = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  res.json({ success: true, message: result.message });
});

export const googleIdTokenLogin = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.googleIdTokenLogin(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({
    success: true,
    message: result.isNewUser ? 'Account created and logged in with Google' : 'Google login successful',
    data: result,
  });
});

export const oauthSuccess = (_req: Request, res: Response) => {
  res.type('html').send(`<!doctype html><html><body style="font-family: monospace; background: #111; color: #eee;">
<h3>Google login successful — copy for Postman</h3><pre id="out">reading…</pre><script>
const h = new URLSearchParams(location.hash.slice(1));
out.textContent = JSON.stringify({ accessToken: h.get('accessToken'), refreshToken: h.get('refreshToken'), idToken: h.get('idToken') }, null, 2);
</script></body></html>`);
};