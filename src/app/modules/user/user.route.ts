import { Router } from 'express';
import { upload } from '@lib/multer';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import * as userController from '@modules/user/user.controller';
import { updateProfileSchema } from '@modules/user/user.validation';

const router = Router();

router.patch('/me', checkAuth(), validateRequest(updateProfileSchema), userController.updateProfile);
router.patch('/me/image', checkAuth(), upload.single('image'), userController.updateProfileImage);

export default router;