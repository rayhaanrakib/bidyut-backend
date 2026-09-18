import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
import type { CheckoutInput } from "./payment.interface";

const DAY = 86_400_000;

export const createCheckoutSession = async (customer: User, input: CheckoutInput) => {
  const isPriority = input.type === "PRIORITY_RESTORATION";

  let outageReportId: string | null = null;
  if (isPriority) {
    const report = await prisma.outageReport.findUnique({ where: { id: input.outageReportId } });
    if (!report || report.customerId !== customer.id)
      throw new AppError(404, "Outage report not found (must be your own)");
    if (report.isPriority) throw new AppError(409, "This report already has priority restoration");
    outageReportId = report.id;
  }

  const amountBDT = isPriority ? config.stripe.priorityPrice : config.stripe.slaPrice;
  const amountPaisa = amountBDT * 100;

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      transactionId,
      userId: customer.id,
      outageReportId,
      type: input.type as any,
      amountPaisa,
      status: "PENDING",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: config.stripe.currency,
          unit_amount: amountPaisa,
          product_data: {
            name: isPriority ? "Priority Restoration Pass" : "SLA Subscription (30 days)",
          },
        },
      },
    ],
    metadata: { paymentId: payment.id },
    success_url: `${config.server.backendUrl}/payment/success?transactionId=${transactionId}`,
    cancel_url: `${config.server.backendUrl}/payment/cancel`,
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });
  return { url: session.url, transactionId };
};

export const completePayment = async (paymentId: string, stripePaymentIntentId: string | null) => {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError(404, "Payment not found");

    if (payment.status !== "PENDING") return;

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", stripePaymentIntentId },
    });

    if (payment.type === "PRIORITY_RESTORATION" && payment.outageReportId) {
      await tx.outageReport.update({
        where: { id: payment.outageReportId },
        data: { isPriority: true },
      });
    }
    if (payment.type === "SLA_SUBSCRIPTION") {
      await tx.user.update({
        where: { id: payment.userId },
        data: { slaActive: true, slaExpiryDate: new Date(Date.now() + config.slaDays * DAY) },
      });
    }

    await tx.activityLog.create({
      data: {
        action: "PAYMENT_COMPLETED",
        entity: "Payment",
        entityId: payment.id,
        actorId: payment.userId,
        metadata: { type: payment.type, amountPaisa: payment.amountPaisa } as any,
      },
    });
  });

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  });
  if (payment) {
    await sendEmail(payment.user.email, "🧾 Your BIDYUT payment receipt", "receipt", {
      name: payment.user.name,
      transactionId: payment.transactionId,
      type: payment.type,
      amountBDT: payment.amountPaisa / 100,
      date: payment.updatedAt.toISOString().slice(0, 10),
    }).catch(() => null);
  }
};

export const listMyPayments = async (userId: string, query: Record<string, unknown>) => {
  const { limit, skip, sortBy, sortOrder, meta } = getPagination(query);
  const where: any = { userId };
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
  ]);
  return { items, meta: meta(total) };
};

export const getByTransactionId = async (user: User, transactionId: string) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new AppError(404, "Payment not found");
  const isStaff = user.role === "ADMIN" || user.role === "POWER_OPERATOR";
  if (!isStaff && payment.userId !== user.id)
    throw new AppError(403, "You cannot view this payment");
  return payment;
};

export const refundPayment = async (actorId: string, transactionId: string) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new AppError(404, "Payment not found");
  if (payment.status !== "COMPLETED")
    throw new AppError(409, "Only COMPLETED payments can be refunded");
  if (!payment.stripePaymentIntentId)
    throw new AppError(409, "No Stripe payment intent recorded for this payment");

  await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });

  return prisma.$transaction(async (tx) => {
    const refunded = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    if (payment.type === "PRIORITY_RESTORATION" && payment.outageReportId) {
      await tx.outageReport.update({
        where: { id: payment.outageReportId },
        data: { isPriority: false },
      });
    }
    if (payment.type === "SLA_SUBSCRIPTION") {
      await tx.user.update({
        where: { id: payment.userId },
        data: { slaActive: false, slaExpiryDate: null },
      });
    }

    await tx.activityLog.create({
      data: {
        action: "PAYMENT_REFUNDED",
        entity: "Payment",
        entityId: payment.id,
        actorId,
        metadata: "",
      },
    });
    return refunded;
  });
};
