import { Request, Response } from 'express';
import * as paymentService from '@modules/payment/payment.service';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { sendResponse } from '@utils/sendResponse';
import config from '@app/config';
import { stripe, Stripe } from '@lib/stripe';

export const createCheckout = tryCatchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createCheckoutSession(req.user!, req.body);
  sendResponse(res, 201, 'Checkout session created', result);
});

export const stripeWebhook = tryCatchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await paymentService.completePayment(paymentId, (session.payment_intent as string) ?? null);
    }
  }

  res.json({ received: true });
});