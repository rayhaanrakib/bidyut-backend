import { type Request, type Response, Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { paymentLimiter } from "../../middleware/rateLimiter";
import validateRequest from "../../middleware/validateRequest";
import { sendResponse } from "../../utils/sendResponse";
import * as paymentController from "./payment.controller";
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
router.post("/success", (_req: Request, res: Response) => {
  sendResponse(res, 200, "Payment Completed Successfully", null);
});
router.post("/cancel", (_req: Request, res: Response) => {
  sendResponse(res, 400, "Payment Cancelled", null);
});

router.get("/my-payments", checkAuth("CUSTOMER"), paymentController.myPayments);
router.get("/:transactionId", checkAuth(), paymentController.getByTransaction);
router.post("/refund", checkAuth("ADMIN"), validateRequest(refundSchema), paymentController.refund);

export default router;
