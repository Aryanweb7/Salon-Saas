import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

export type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: Date;
  salon: {
    name: string;
    logoUrl?: string;
    address?: string;
    contactNumber?: string;
    gstNumber?: string;
  };
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    kind: "service" | "product";
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
};

function formatMoney(value: number) {
  const amount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);

  return `Rs. ${amount}`;
}

function textOrDash(value?: string | null) {
  return value?.trim() ? value : "-";
}

export async function generateInvoicePdf(invoice: InvoicePdfData) {
  const invoicesDir = path.join(process.cwd(), "public", "invoices");
  await fs.mkdir(invoicesDir, { recursive: true });

  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const stream = doc.pipe(fsSync.createWriteStream(filePath));

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc
      .fontSize(24)
      .fillColor("#111827")
      .text(invoice.salon.name, 48, 48)
      .fontSize(10)
      .fillColor("#4b5563")
      .text(textOrDash(invoice.salon.address), 48, 82)
      .text(`Phone: ${textOrDash(invoice.salon.contactNumber)}`, 48, 98)
      .text(`GST: ${textOrDash(invoice.salon.gstNumber)}`, 48, 114);

    doc
      .fontSize(22)
      .fillColor("#111827")
      .text("INVOICE", 395, 48, { align: "right" })
      .fontSize(10)
      .fillColor("#4b5563")
      .text(invoice.invoiceNumber, 395, 80, { align: "right" })
      .text(invoice.invoiceDate.toLocaleDateString("en-IN"), 395, 96, { align: "right" });

    doc.moveTo(48, 145).lineTo(547, 145).strokeColor("#e5e7eb").stroke();

    doc
      .fontSize(11)
      .fillColor("#111827")
      .text("Bill To", 48, 166)
      .fontSize(10)
      .fillColor("#4b5563")
      .text(invoice.customer.name, 48, 186)
      .text(`Phone: ${invoice.customer.phone}`, 48, 202)
      .text(`Email: ${textOrDash(invoice.customer.email)}`, 48, 218);

    doc
      .fontSize(11)
      .fillColor("#111827")
      .text("Payment", 360, 166)
      .fontSize(10)
      .fillColor("#4b5563")
      .text(`Method: ${invoice.paymentMethod}`, 360, 186)
      .text(`Status: ${invoice.paymentStatus}`, 360, 202);

    const tableTop = 260;
    doc.rect(48, tableTop, 499, 28).fill("#f3f4f6");
    doc.fillColor("#111827").fontSize(9).text("Item", 58, tableTop + 10);
    doc.text("Type", 258, tableTop + 10);
    doc.text("Qty", 340, tableTop + 10, { width: 40, align: "right" });
    doc.text("Price", 390, tableTop + 10, { width: 65, align: "right" });
    doc.text("Total", 472, tableTop + 10, { width: 65, align: "right" });

    let y = tableTop + 42;
    invoice.items.forEach((item) => {
      if (y > 690) {
        doc.addPage();
        y = 60;
      }

      doc
        .fillColor("#111827")
        .fontSize(10)
        .text(item.name, 58, y, { width: 185 })
        .fillColor("#4b5563")
        .text(item.kind, 258, y, { width: 70 })
        .text(String(item.quantity), 340, y, { width: 40, align: "right" })
        .text(formatMoney(item.unitPrice), 390, y, { width: 65, align: "right" })
        .text(formatMoney(item.total), 472, y, { width: 65, align: "right" });
      y += 28;
    });

    const totalsTop = Math.max(y + 18, 520);
    const totalRows = [
      ["Subtotal", invoice.subtotal],
      ["Discount", -invoice.discountAmount],
      [`GST (${invoice.taxRate}%)`, invoice.taxAmount],
      ["Grand Total", invoice.totalAmount],
    ] as const;

    totalRows.forEach(([label, value], index) => {
      const rowY = totalsTop + index * 24;
      doc
        .fontSize(index === totalRows.length - 1 ? 12 : 10)
        .fillColor(index === totalRows.length - 1 ? "#111827" : "#4b5563")
        .text(label, 360, rowY, { width: 90 })
        .text(formatMoney(value), 462, rowY, { width: 75, align: "right" });
    });

    doc
      .fontSize(10)
      .fillColor("#4b5563")
      .text(`Thank you for visiting ${invoice.salon.name}.`, 48, 760, {
        width: 499,
        align: "center",
      });

    doc.end();
  });

  return {
    pdfPath: filePath,
    pdfUrl: `/invoices/${fileName}`,
  };
}

export async function readInvoicePdfAsBase64(pdfPath: string) {
  const file = await fs.readFile(pdfPath);
  return file.toString("base64");
}
