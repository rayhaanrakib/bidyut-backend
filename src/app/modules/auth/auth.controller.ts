import type { NextFunction, Request, Response } from "express";
import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import passport from "../../lib/passport";
import { clearAuthCookies, setAuthCookies } from "../../utils/authCookie";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import * as authService from "./auth.service";

export const register = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, message: result.message, data: result });
});

export const verifyOtp = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: result,
  });
});

export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: false },
    (err: Error | null, user: User | null | undefined, info: any | null) => {
      if (err) return next(err);
      if (!user)
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid credentials",
        });

      const tokens = authService.issueTokens(user);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      sendResponse(res, 200, "Login successful", {
        user: authService.safeUser(user),
        ...tokens,
      });
    },
  )(req, res, next);
};

export const me = tryCatchAsync(async (req: Request, res: Response) => {
  sendResponse(res, 200, "Current user profile", {
    user: authService.safeUser(req.user as User),
  });
});

export const refresh = tryCatchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshTokens(
    req.cookies?.refreshToken || req.body?.refreshToken,
  );
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendResponse(res, 200, "New tokens issued", tokens);
});

export const logout = tryCatchAsync(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  sendResponse(res, 200, "Logged out successfully");
});

export const googleLogin = (_req: Request, res: Response) => {
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(config.google.clientId)}` +
    `&redirect_uri=${encodeURIComponent(
      `${config.server.backendUrl}/api/v1/auth/google/callback`,
    )}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("profile email")}`;

  return res.redirect(googleAuthUrl);
};

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error("Google login failed:", err?.message || info?.message);
      return res.redirect(`${config.server.backendUrl}/api/v1/auth/login?error=google_failed`);
    }
    const tokens = authService.issueTokens(user);
    const googleIdToken = (req as any).googleIdToken;
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, googleIdToken);
    const fragment = `#accessToken=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}${googleIdToken ? `&idToken=${encodeURIComponent(googleIdToken)}` : ""}`;
    res.redirect(`${config.server.backendUrl}/api/v1/auth/oauth/success${fragment}`);
  })(req, res, next);
};

export const forgotPassword = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  sendResponse(res, 200, result.message);
});

export const resetPassword = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  sendResponse(res, 200, result.message);
});

export const googleIdTokenLogin = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await authService.googleIdTokenLogin(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendResponse(
    res,
    200,
    result.isNewUser ? "Account created and logged in with Google" : "Google login successful",
    result,
  );
});
