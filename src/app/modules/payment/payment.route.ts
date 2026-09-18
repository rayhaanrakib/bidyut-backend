import { type Request, type Response, Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { paymentLimiter } from "../../middleware/rateLimiter";
import validateRequest from "../../middleware/validateRequest";
import * as paymentController from "./payment.controller";
import { paymentUtils } from "./payment.utils";
import { checkoutSchema, refundSchema } from "./payment.validation";

const router = Router();

router.post(
  "/checkout-session",
  paymentLimiter,
  checkAuth("CUSTOMER"),
  validateRequest(checkoutSchema),
  paymentController.createCheckout,
);
router.post("/webhook", paymentController.stripeWebhook);

// payment status backend test redirect
router.get("/success", (_req: Request, res: Response) => {
  paymentUtils.paymentSuccessPage(res);
});

router.get("/cancel", (_req: Request, res: Response) => {
  paymentUtils.paymentCancelPage(res);
});

router.get("/my-payments", checkAuth("CUSTOMER"), paymentController.myPayments);
router.get("/:transactionId", checkAuth(), paymentController.getByTransaction);
router.post("/refund", checkAuth("ADMIN"), validateRequest(refundSchema), paymentController.refund);

export default router;
