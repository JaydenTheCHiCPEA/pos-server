import type { Item, Transaction } from "@/types";

export type AnalyticsRange = "today" | "week" | "month" | "year";

export interface DashboardMetrics {
  /** Sum of all sale transaction totals in the period (before refunds). */
  totalSales: number;
  /** Sum of refund amounts (stored as negative; reported as positive). */
  totalRefunds: number;
  /** totalSales minus totalRefunds — the true revenue for the period. */
  netSales: number;
  /** Revenue minus item cost of goods sold (sales only, pre-refund). */
  grossProfit: number;
  /** grossProfit / totalSales × 100 when totalSales > 0. */
  profitMarginPct: number;
  saleCount: number;
  refundCount: number;
  itemsSold: number;
  totalDiscounts: number;
  totalTax: number;
  avgSale: number;
}

export function getRangeStart(r: AnalyticsRange): Date {
  const now = new Date();
  if (r === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (r === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (r === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

export function getPreviousRange(r: AnalyticsRange): { start: Date; end: Date } {
  const now = new Date();
  if (r === "today") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (r === "week") {
    const end = new Date(now);
    end.setDate(end.getDate() - 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (r === "month") {
    const end = new Date(now);
    end.setMonth(end.getMonth() - 1);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    return { start, end };
  }
  const end = new Date(now);
  end.setFullYear(end.getFullYear() - 1);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  return { start, end };
}

export function pctChange(current: number, previous: number): string | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return "+100%";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export function computeDashboardMetrics(
  transactions: Transaction[],
  items: Item[],
  since: Date,
): DashboardMetrics {
  const sales = transactions.filter(
    (t) => t.type === "sale" && new Date(t.timestamp) >= since,
  );
  const refunds = transactions.filter(
    (t) => t.type === "refund" && new Date(t.timestamp) >= since,
  );

  const totalSales = sales.reduce((s, t) => s + t.total, 0);
  const totalRefunds = refunds.reduce((s, t) => s + Math.abs(t.total), 0);
  const netSales = totalSales - totalRefunds;

  const grossProfit = sales.reduce((s, t) => {
    const cost = t.items.reduce((c, ci) => {
      const item = items.find((i) => i.id === ci.itemId);
      return c + (item?.cost ?? 0) * ci.quantity;
    }, 0);
    return s + t.total - cost;
  }, 0);

  const saleCount = sales.length;
  const itemsSold = sales.reduce(
    (s, t) => s + t.items.reduce((q, ci) => q + ci.quantity, 0),
    0,
  );

  return {
    totalSales,
    totalRefunds,
    netSales,
    grossProfit,
    profitMarginPct: totalSales > 0 ? (grossProfit / totalSales) * 100 : 0,
    saleCount,
    refundCount: refunds.length,
    itemsSold,
    totalDiscounts: sales.reduce((s, t) => s + t.discountAmount, 0),
    totalTax: sales.reduce((s, t) => s + t.taxAmount, 0),
    avgSale: saleCount > 0 ? totalSales / saleCount : 0,
  };
}
