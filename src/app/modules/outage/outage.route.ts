import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import * as outageController from "./outage.controller";
import { assignSchema, reportOutageSchema, updateStatusSchema } from "./outage.validation";

const router = Router();

router.post(
  "/",
  checkAuth("CUSTOMER"),
  validateRequest(reportOutageSchema),
  outageController.report,
);
router.get("/", checkAuth(), outageController.list);
router.get("/my-reports", checkAuth("CUSTOMER"), outageController.list);
router.get("/:id", checkAuth(), outageController.getById);
router.patch(
  "/:id/status",
  checkAuth("POWER_OPERATOR", "ADMIN", "FIELD_TECHNICIAN"),
  validateRequest(updateStatusSchema),
  outageController.updateStatus,
);
router.patch(
  "/:id/assign",
  checkAuth("POWER_OPERATOR", "ADMIN"),
  validateRequest(assignSchema),
  outageController.assign,
);
router.delete("/:id/cancel", checkAuth("CUSTOMER"), outageController.cancel);

export default router;
