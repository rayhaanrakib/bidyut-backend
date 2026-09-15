import { Router } from 'express';
import { upload } from '@lib/multer';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import * as userController from '@modules/user/user.controller';
import { adminUpdateRoleSchema, adminUpdateStatusSchema, staffCreateSchema, updateProfileSchema } from '@modules/user/user.validation';

const router = Router();

router.patch('/me', checkAuth(), validateRequest(updateProfileSchema), userController.updateProfile);
router.patch('/me/image', checkAuth(), upload.single('image'), userController.updateProfileImage);
router.get('/me/profile', checkAuth(), userController.getMyProfile);
router.patch('/me/profile', checkAuth(), userController.updateMyProfile);

router.get('/', checkAuth('ADMIN', 'POWER_OPERATOR'), userController.getAllUsers);
router.get('/:id', checkAuth('ADMIN'), userController.getSingleUser);
router.patch('/:id/role', checkAuth('ADMIN'), validateRequest(adminUpdateRoleSchema), userController.updateRole);
router.patch('/:id/status', checkAuth('ADMIN'), validateRequest(adminUpdateStatusSchema), userController.updateStatus);
router.delete('/:id', checkAuth('ADMIN'), userController.softDelete);
router.post('/staff', checkAuth('ADMIN', 'POWER_OPERATOR'), validateRequest(staffCreateSchema), userController.createStaff);

export default router;