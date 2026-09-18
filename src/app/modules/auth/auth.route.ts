import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { authLimiter } from "../../middleware/rateLimiter";
import validateRequest from "../../middleware/validateRequest";
import * as authController from "./auth.controller";
import { authUtils } from "./auth.utils";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./auth.validation";

const router = Router();

router.post("/register", authLimiter, validateRequest(registerSchema), authController.register);
router.post("/verify-otp", validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post("/login", authLimiter, validateRequest(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", checkAuth(), authController.me);
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);
// Google login via ID token
router.post("/google", validateRequest(googleLoginSchema), authController.googleIdTokenLogin);
router.get("/oauth/success", authUtils.oauthSuccess);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post("/reset-password", validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
