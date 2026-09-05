import { AnomalyItem, ReconciledRecord } from "../types";

export function detectStatisticalAnomalies(records: ReconciledRecord[]): AnomalyItem[] {
  const anomalies: AnomalyItem[] = [];

  if (!records || records.length === 0) return anomalies;

  // 1. Calculate Mean and Standard Deviation for Z-score
  const amounts = records.map((r) => r.amount).filter((a) => typeof a === "number" && !isNaN(a));
  if (amounts.length === 0) return anomalies;

  const totalAmount = amounts.reduce((acc, v) => acc + v, 0);
  const meanAmount = totalAmount / amounts.length;

  const variance =
    amounts.reduce((acc, v) => acc + Math.pow(v - meanAmount, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // 2. Calculate IQR (Interquartile Range)
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const q1 = sortedAmounts[Math.floor(sortedAmounts.length * 0.25)];
  const q3 = sortedAmounts[Math.floor(sortedAmounts.length * 0.75)];
  const iqr = q3 - q1;
  const iqrThreshold = q3 + 2.5 * iqr;

  // 3. Scan records for statistical outliers and operational anomalies
  for (const record of records) {
    // A. High-Value Outlier (Z-score > 2.5 or IQR breach)
    const zScore = stdDev > 0 ? (record.amount - meanAmount) / stdDev : 0;
    if (zScore > 2.5 || record.amount > iqrThreshold) {
      anomalies.push({
        id: `ANOM-HV-${record.transaction_id}`,
        transaction_id: record.transaction_id,
        type: "HIGH_VALUE_OUTLIER",
        severity: record.amount > 500000 ? "CRITICAL" : "HIGH",
        metric: "Transaction Principal Outlier",
        value: `₹${record.amount.toLocaleString("en-IN")} (Z-score: +${zScore.toFixed(2)})`,
        threshold: `Mean: ₹${Math.round(meanAmount).toLocaleString("en-IN")}, IQR Upper: ₹${Math.round(iqrThreshold).toLocaleString("en-IN")}`,
        description: `Transaction amount is ${zScore.toFixed(1)} standard deviations above the mean. Requires second-tier controller authorization.`,
        record,
      });
    }

    // B. Unusual Fee Percentage Ratio
    if (record.source_b && record.source_b.gateway_fee && record.amount > 0) {
      const feeRatio = (record.source_b.gateway_fee / record.amount) * 100;
      if (feeRatio > 3.5 || feeRatio < 0.15) {
        anomalies.push({
          id: `ANOM-FEE-${record.transaction_id}`,
          transaction_id: record.transaction_id,
          type: "UNUSUAL_FEE_RATIO",
          severity: feeRatio > 4.5 ? "HIGH" : "MEDIUM",
          metric: "Gateway Fee Ratio Variance",
          value: `${feeRatio.toFixed(2)}% of transaction amount`,
          threshold: "Normal Contractual Range: 1.5% - 2.5%",
          description: `Gateway fee percentage charged is abnormal (${feeRatio.toFixed(2)}%). Likely misclassified card tier or improper surcharge application.`,
          record,
        });
      }
    }

    // C. Delayed Settlement SLA
    if (record.source_a && record.source_b && record.source_b.settlement_date) {
      const authTime = new Date(record.source_a.date).getTime();
      const settleTime = new Date(record.source_b.settlement_date).getTime();
      const lagDays = (settleTime - authTime) / (1000 * 60 * 60 * 24);
      if (lagDays > 3.5) {
        anomalies.push({
          id: `ANOM-LAG-${record.transaction_id}`,
          transaction_id: record.transaction_id,
          type: "SETTLEMENT_DELAY",
          severity: lagDays > 6 ? "HIGH" : "MEDIUM",
          metric: "Settlement Clearing Cycle Lag",
          value: `${lagDays.toFixed(1)} days`,
          threshold: "Standard SLA: ≤ 2.0 days (T+2)",
          description: `Settlement funds took ${lagDays.toFixed(1)} days to clear, breaching payment gateway SLA and impacting working capital float.`,
          record,
        });
      }
    }

    // D. Duplicate Transaction Flag
    if (record.match_status === "DUPLICATE") {
      anomalies.push({
        id: `ANOM-DUP-${record.transaction_id}`,
        transaction_id: record.transaction_id,
        type: "DUPLICATE_SPIKE",
        severity: "HIGH",
        metric: "Idempotency Collision",
        value: `Multiple entries for Ref ${record.reference_id}`,
        threshold: "1 unique settlement record per payment reference",
        description: `Potential double charge or duplicate gateway webhook invocation without idempotent deduplication.`,
        record,
      });
    }
  }

  return anomalies.slice(0, 15); // Return top anomalies
}
