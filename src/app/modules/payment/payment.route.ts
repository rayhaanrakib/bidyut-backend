import { Request, Response, Router } from 'express';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import * as paymentController from '@modules/payment/payment.controller';
import { checkoutSchema } from '@modules/payment/payment.validation';
import { sendResponse } from '@utils/sendResponse';

const router = Router();

router.post('/checkout-session', checkAuth('CUSTOMER'), validateRequest(checkoutSchema), paymentController.createCheckout);
router.post('/webhook', paymentController.stripeWebhook);

// payment status backend test redirect
router.post("/success", (req: Request, res: Response) => {
  sendResponse(
    res,
    200,
    "Payment Completed Successfully",
    null,
  );
});
router.post("/cancel", (req: Request, res: Response) => {
  sendResponse(
    res,
    400,
    "Payment Cancelled",
    null,
  );
});

router.get('/my-payments', checkAuth('CUSTOMER'), paymentController.myPayments);
router.get('/:transactionId', checkAuth(), paymentController.getByTransaction);


export default router;