import { z } from "zod";

export const checkoutSchema = z
  .object({
    type: z.enum(["PRIORITY_RESTORATION", "SLA_SUBSCRIPTION"]),
    outageReportId: z.string().uuid().optional(),
  })
  .refine((d) => d.type !== "PRIORITY_RESTORATION" || Boolean(d.outageReportId), {
    message: "outageReportId is required for a priority restoration pass",
  });

export const refundSchema = z.object({
  transactionId: z.string().min(3, "transactionId is required"),
});
