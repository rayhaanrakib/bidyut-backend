import { Router } from "express";
import { upload } from "../../lib/multer";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import * as userController from "./user.controller";
import {
  adminUpdateRoleSchema,
  adminUpdateStatusSchema,
  staffCreateSchema,
  updateProfileSchema,
  applyTechnicianSchema,
  decideApplicationSchema,
} from "./user.validation";

const router = Router();

router.patch(
  "/me",
  checkAuth(),
  validateRequest(updateProfileSchema),
  userController.updateProfile,
);
router.patch("/me/image", checkAuth(), upload.single("image"), userController.updateProfileImage);
router.get("/me/profile", checkAuth(), userController.getMyProfile);
router.patch("/me/profile", checkAuth(), userController.updateMyProfile);

router.get("/", checkAuth("ADMIN", "POWER_OPERATOR"), userController.getAllUsers);
router.get("/:id", checkAuth("ADMIN"), userController.getSingleUser);
router.patch(
  "/:id/role",
  checkAuth("ADMIN"),
  validateRequest(adminUpdateRoleSchema),
  userController.updateRole,
);
router.patch(
  "/:id/status",
  checkAuth("ADMIN"),
  validateRequest(adminUpdateStatusSchema),
  userController.updateStatus,
);
router.delete("/:id", checkAuth("ADMIN"), userController.softDelete);
router.post(
  "/staff",
  checkAuth("ADMIN", "POWER_OPERATOR"),
  validateRequest(staffCreateSchema),
  userController.createStaff,
);


// apply as technician
router.post('/apply-as-technician', checkAuth('CUSTOMER'), upload.single('resume'), validateRequest(applyTechnicianSchema), userController.applyAsTechnician);
router.get('/technician-applications', checkAuth('ADMIN'), userController.listTechnicianApplications);
router.patch('/technician-applications/:userId', checkAuth('ADMIN'), validateRequest(decideApplicationSchema), userController.decideTechnicianApplication);

export default router;
