import type { Request, Response } from "express";
import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import { type Stripe, stripe } from "../../lib/stripe";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import * as paymentService from "./payment.service";

export const createCheckout = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createCheckoutSession(req.user as User, req.body);
  sendResponse(res, 201, "Checkout session created", result);
});

export const stripeWebhook = tryCatchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  } catch (err: any) {
    return res
      .status(400)
      .json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await paymentService.completePayment(paymentId, (session.payment_intent as string) ?? null);
    }
  }

  sendResponse(res, 200, "Webhook received");
});

export const myPayments = tryCatchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await paymentService.listMyPayments((req.user as User).id, req.query);
  sendResponse(res, 200, "Payments retrieved", items, meta);
});

export const getByTransaction = tryCatchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getByTransactionId(
    req.user as User,
    req.params.transactionId as string,
  );
  sendResponse(res, 200, "Payment retrieved", payment);
});

export const refund = tryCatchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.refundPayment((req.user as User).id, req.body.transactionId);
  sendResponse(res, 200, "Payment refunded and status updated", payment);
});
