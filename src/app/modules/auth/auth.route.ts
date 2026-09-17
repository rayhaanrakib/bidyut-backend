import { Router } from 'express';
import validateRequest from '@middleware/validateRequest';
import checkAuth from '@middleware/checkAuth';
import * as authController from '@modules/auth/auth.controller';
import { registerSchema, verifyOtpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleLoginSchema } from '@modules/auth/auth.validation';
import { authLimiter } from '@middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', checkAuth(), authController.me);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
// Google login via ID token
router.post('/google', validateRequest(googleLoginSchema), authController.googleIdTokenLogin);
router.get('/oauth/success', authController.oauthSuccess);

router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;