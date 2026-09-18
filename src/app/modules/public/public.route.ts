import { Router } from "express";
import { gridStatus } from "./public.controller";

const router = Router();
router.get("/grid-status/:areaId", gridStatus);

export default router;
