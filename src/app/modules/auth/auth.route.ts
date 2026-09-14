import { Router } from 'express';
import validateRequest from '@middleware/validateRequest';
import checkAuth from '@middleware/checkAuth';
import * as authController from '@modules/auth/auth.controller';
import { registerSchema, verifyOtpSchema, loginSchema } from '@modules/auth/auth.validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', checkAuth(), authController.me);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

export default router;