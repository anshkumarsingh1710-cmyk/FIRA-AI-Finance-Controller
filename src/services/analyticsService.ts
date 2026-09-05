import {
  CashPositionMetrics,
  FinancialAnalyticsSummary,
  ReconciledRecord,
} from "../types";

export function computeFinancialAnalytics(records: ReconciledRecord[]): FinancialAnalyticsSummary {
  let totalTransactionValue = 0;
  let totalSettledValue = 0;
  let totalFees = 0;
  let totalTax = 0;
  let totalNetValue = 0;
  let largestTransaction = 0;
  let successfulCount = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let refundedCount = 0;
  let exceptionCount = 0;

  const dateMap = new Map<string, { volume: number; value: number; matchedValue: number; exceptionValue: number }>();
  const statusMap = new Map<string, { count: number; value: number }>();
  const exceptionMap = new Map<string, { count: number; value: number }>();
  const paymentMethodMap = new Map<string, { count: number; value: number }>();

  for (const record of records) {
    const amount = record.amount || 0;
    totalTransactionValue += amount;

    if (amount > largestTransaction) {
      largestTransaction = amount;
    }

    if (record.source_b) {
      totalSettledValue += record.source_b.amount || 0;
      totalFees += record.source_b.gateway_fee || 0;
      totalTax += record.source_b.tax || 0;
      totalNetValue += record.source_b.net_amount || 0;
    }

    // Status counters
    if (record.status === "SUCCESS") successfulCount++;
    else if (record.status === "FAILED") failedCount++;
    else if (record.status === "PENDING") pendingCount++;
    else if (record.status === "REFUNDED") refundedCount++;

    if (record.match_status !== "MATCHED") {
      exceptionCount++;
    }

    // Date grouping
    const dateKey = record.date ? record.date.substring(0, 10) : "2026-08-20";
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { volume: 0, value: 0, matchedValue: 0, exceptionValue: 0 });
    }
    const dateEntry = dateMap.get(dateKey)!;
    dateEntry.volume += 1;
    dateEntry.value += amount;
    if (record.match_status === "MATCHED") {
      dateEntry.matchedValue += amount;
    } else {
      dateEntry.exceptionValue += amount;
    }

    // Status grouping
    const statusKey = record.status || "UNKNOWN";
    if (!statusMap.has(statusKey)) {
      statusMap.set(statusKey, { count: 0, value: 0 });
    }
    const statusEntry = statusMap.get(statusKey)!;
    statusEntry.count += 1;
    statusEntry.value += amount;

    // Exception grouping
    if (record.exception_type && record.exception_type !== "NONE") {
      const exKey = record.exception_type;
      if (!exceptionMap.has(exKey)) {
        exceptionMap.set(exKey, { count: 0, value: 0 });
      }
      const exEntry = exceptionMap.get(exKey)!;
      exEntry.count += 1;
      exEntry.value += record.difference_amount || amount;
    }

    // Payment method grouping
    const method = record.source_a?.payment_method || "UPI";
    if (!paymentMethodMap.has(method)) {
      paymentMethodMap.set(method, { count: 0, value: 0 });
    }
    const methodEntry = paymentMethodMap.get(method)!;
    methodEntry.count += 1;
    methodEntry.value += amount;
  }

  const avgTransactionValue =
    records.length > 0 ? Math.round((totalTransactionValue / records.length) * 100) / 100 : 0;

  // Format Volume Over Time
  const volumeOverTime = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: date.substring(5), // MM-DD
      volume: data.volume,
      value: Math.round(data.value),
      matchedValue: Math.round(data.matchedValue),
      exceptionValue: Math.round(data.exceptionValue),
    }));

  const statusDistribution = Array.from(statusMap.entries()).map(([status, d]) => ({
    status,
    count: d.count,
    value: Math.round(d.value),
  }));

  const EXCEPTION_COLORS: Record<string, string> = {
    AMOUNT_MISMATCH: "#f59e0b",
    MISSING_TRANSACTION: "#ef4444",
    DUPLICATE_TRANSACTION: "#ec4899",
    FEE_MISMATCH: "#8b5cf6",
    DATE_MISMATCH: "#06b6d4",
    STATUS_MISMATCH: "#dc2626",
    REFERENCE_MISMATCH: "#6366f1",
    UNRESOLVED: "#94a3b8",
  };

  const exceptionDistribution = Array.from(exceptionMap.entries()).map(([type, d]) => ({
    type: type.replace(/_/g, " "),
    count: d.count,
    value: Math.round(d.value),
    color: EXCEPTION_COLORS[type] || "#3b82f6",
  }));

  const paymentMethodDistribution = Array.from(paymentMethodMap.entries()).map(([method, d]) => ({
    method: method.replace(/_/g, " "),
    count: d.count,
    value: Math.round(d.value),
  }));

  return {
    totalTransactionValue: Math.round(totalTransactionValue * 100) / 100,
    totalSettledValue: Math.round(totalSettledValue * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalNetValue: Math.round(totalNetValue * 100) / 100,
    avgTransactionValue,
    largestTransaction: Math.round(largestTransaction * 100) / 100,
    successfulCount,
    failedCount,
    pendingCount,
    refundedCount,
    exceptionCount,
    volumeOverTime,
    statusDistribution,
    exceptionDistribution,
    paymentMethodDistribution,
  };
}

export function computeCashPosition(
  records: ReconciledRecord[],
  analytics: FinancialAnalyticsSummary
): CashPositionMetrics {
  let unresolvedAmounts = 0;
  let pendingSettlements = 0;

  for (const r of records) {
    if (r.match_status !== "MATCHED" && !r.resolved) {
      unresolvedAmounts += r.difference_amount || r.amount;
    }
    if (r.status === "PENDING" || (r.source_b && r.source_b.status === "PENDING")) {
      pendingSettlements += r.amount;
    }
  }

  const grossTransactionValue = analytics.totalTransactionValue;
  const totalFees = analytics.totalFees;
  const totalTaxes = analytics.totalTax;

  // Estimated Net Position = Gross - Fees - Taxes - Unresolved Amounts
  const estimatedNetPosition = Math.max(
    0,
    Math.round((grossTransactionValue - totalFees - totalTaxes - unresolvedAmounts) * 100) / 100
  );

  const expectedSettlementValue = Math.round(
    (analytics.totalSettledValue - pendingSettlements) * 100
  ) / 100;

  return {
    grossTransactionValue: Math.round(grossTransactionValue * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    totalTaxes: Math.round(totalTaxes * 100) / 100,
    unresolvedAmounts: Math.round(unresolvedAmounts * 100) / 100,
    estimatedNetPosition,
    pendingSettlements: Math.round(pendingSettlements * 100) / 100,
    expectedSettlementValue: Math.max(0, expectedSettlementValue),
    exceptionExposure: Math.round(unresolvedAmounts * 100) / 100,
  };
}
