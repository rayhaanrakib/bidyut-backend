import PDFDocument from "pdfkit";

export const buildReceiptPdf = async (payment: {
  transactionId: string;
  type: string;
  amountPaisa: number;
  updatedAt: Date;
  user: { name: string };
}) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks))),
  );

  doc.fontSize(20).text("BIDYUT", { align: "center" });
  doc.fontSize(14).text("Payment Receipt", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(12);
  doc.text(`Customer: ${payment.user.name}`);
  doc.text(`Transaction ID: ${payment.transactionId}`);
  doc.text(`Product: ${payment.type}`);
  doc.text(`Amount: BDT ${payment.amountPaisa / 100}`);
  doc.text(`Date: ${payment.updatedAt.toISOString().slice(0, 10)}`);
  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#888")
    .text("Thank you for using BIDYUT — this receipt was generated automatically.", {
      align: "center",
    });

  doc.end();
  return done;
};
