import { Router } from "express";
import { dispatchNotifications } from "./internal.controller";

const router = Router();
router.post("/dispatch-notifications", dispatchNotifications);

export default router;
