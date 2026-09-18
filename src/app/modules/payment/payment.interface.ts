export interface CheckoutInput {
  type: "PRIORITY_RESTORATION" | "SLA_SUBSCRIPTION";
  outageReportId?: string; // the priority pass pays for ONE report
}
