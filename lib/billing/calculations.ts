export type DiscountType = "percentage" | "fixed";

export type BillableItem = {
  kind: "service" | "product";
  name: string;
  quantity: number;
  unitPrice: number;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals({
  items,
  discountType,
  discountValue,
  taxRate,
}: {
  items: BillableItem[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
}) {
  const normalizedItems = items.map((item) => ({
    ...item,
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    total: roundMoney(Math.max(1, Number(item.quantity) || 1) * Math.max(0, Number(item.unitPrice) || 0)),
  }));

  const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const rawDiscount = discountType === "percentage" ? subtotal * (Math.max(0, discountValue) / 100) : Math.max(0, discountValue);
  const discountAmount = roundMoney(Math.min(subtotal, rawDiscount));
  const taxableAmount = roundMoney(Math.max(0, subtotal - discountAmount));
  const taxAmount = roundMoney(taxableAmount * (Math.max(0, taxRate) / 100));
  const totalAmount = roundMoney(taxableAmount + taxAmount);

  return {
    items: normalizedItems,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  };
}
