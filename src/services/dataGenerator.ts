import {
  FinancialRecord,
  GroundTruthScenario,
  PaymentMethod,
  TransactionStatus,
} from "../types";

export interface GeneratedDataset {
  sourceA: FinancialRecord[];
  sourceB: FinancialRecord[];
  sourceC: FinancialRecord[];
  groundTruth: Map<string, GroundTruthScenario>;
  summary: {
    totalRecords: number;
    genuineMatches: number;
    amountMismatches: number;
    missingRecords: number;
    duplicateRecords: number;
    feeDiscrepancies: number;
    dateDiscrepancies: number;
    statusMismatches: number;
    referenceMismatches: number;
  };
}

const MERCHANTS = [
  "ABC Technologies",
  "Nova Retail",
  "UrbanMart",
  "CloudKart",
  "Metro Electronics",
  "GreenBasket",
  "TechSphere",
  "Prime Traders",
];

const DESCRIPTIONS = [
  "Payment for Enterprise Cloud SaaS Subscription",
  "E-Commerce Retail Order Fulfilment",
  "Bulk Electronics Inventory Supply",
  "Monthly Logistics & Delivery Charges",
  "Corporate Software License Renewal",
  "Point-of-Sale Terminal Checkout",
  "Supply Chain Distribution Invoice",
  "Digital Marketing Platform Spend",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "NET_BANKING",
  "WALLET",
];

export function generateSyntheticDataset(recordCount: number = 100): GeneratedDataset {
  const sourceA: FinancialRecord[] = [];
  const sourceB: FinancialRecord[] = [];
  const sourceC: FinancialRecord[] = [];
  const groundTruth = new Map<string, GroundTruthScenario>();

  // Ratio allocations based on record count
  const targetDuplicates = Math.max(2, Math.round(recordCount * 0.03));
  const targetMissing = Math.max(3, Math.round(recordCount * 0.04));
  const targetAmountMismatch = Math.max(4, Math.round(recordCount * 0.06));
  const targetFeeMismatch = Math.max(2, Math.round(recordCount * 0.03));
  const targetDateMismatch = Math.max(2, Math.round(recordCount * 0.03));
  const targetStatusMismatch = Math.max(2, Math.round(recordCount * 0.02));
  const targetRefMismatch = Math.max(1, Math.round(recordCount * 0.02));

  let countDuplicates = 0;
  let countMissing = 0;
  let countAmountMismatch = 0;
  let countFeeMismatch = 0;
  let countDateMismatch = 0;
  let countStatusMismatch = 0;
  let countRefMismatch = 0;

  const baseDate = new Date("2026-08-20T09:00:00Z");

  for (let i = 1; i <= recordCount; i++) {
    const txnId = `TXN-${1000 + i}`;
    const refId = `REF-IND-${800000 + i}`;
    const settleId = `SETTLE-B26-${400000 + i}`;

    const merchant = MERCHANTS[(i - 1) % MERCHANTS.length];
    const description = DESCRIPTIONS[(i - 1) % DESCRIPTIONS.length];
    const paymentMethod = PAYMENT_METHODS[(i - 1) % PAYMENT_METHODS.length];

    // Realistic INR transaction amounts between 500 and 150,000
    // Occasional high value outlier for anomaly detection
    let amount = 0;
    if (i === 17) {
      amount = 890000; // High value outlier
    } else if (i % 7 === 0) {
      amount = Math.round((25000 + (i * 370) % 45000) / 10) * 10;
    } else {
      amount = Math.round((750 + (i * 123) % 9500) / 5) * 5;
    }

    // Standard fee: 2% + 18% GST on fee
    const feeRate = paymentMethod === "CREDIT_CARD" ? 0.022 : paymentMethod === "UPI" ? 0.004 : 0.018;
    const gatewayFee = Math.round(amount * feeRate * 100) / 100;
    const tax = Math.round(gatewayFee * 0.18 * 100) / 100;
    const netAmount = Math.round((amount - gatewayFee - tax) * 100) / 100;

    // Date calculations
    const recordTime = new Date(baseDate.getTime() + i * 28 * 60 * 1000);
    const dateStr = recordTime.toISOString().replace("T", " ").substring(0, 19);

    const settleTime = new Date(recordTime.getTime() + 2 * 24 * 60 * 60 * 1000); // T+2
    const settleDateStr = settleTime.toISOString().replace("T", " ").substring(0, 19);

    const status: TransactionStatus = i % 29 === 0 ? "FAILED" : i % 43 === 0 ? "PENDING" : "SUCCESS";

    // Source A record (Internal Ledger)
    const recordA: FinancialRecord = {
      transaction_id: txnId,
      reference_id: refId,
      date: dateStr,
      customer_name: merchant,
      description,
      amount,
      currency: "INR",
      payment_method: paymentMethod,
      status,
      settlement_id: settleId,
      gateway_fee: gatewayFee,
      tax,
      net_amount: netAmount,
      settlement_date: settleDateStr,
      source_type: "INTERNAL_LEDGER",
    };

    sourceA.push(recordA);

    // Determine ground truth scenario
    if (countAmountMismatch < targetAmountMismatch && i % 8 === 2) {
      // SCENARIO 1: Amount Mismatch (e.g. gateway deducted extra fee or unexpected chargeback/deduction)
      countAmountMismatch++;
      const diff = Math.round((amount * 0.03 + 120) * 10) / 10;
      const settlementAmount = amount - diff;
      const bFee = Math.round(gatewayFee * 1.15 * 100) / 100;
      const bTax = Math.round(bFee * 0.18 * 100) / 100;

      const recordB: FinancialRecord = {
        ...recordA,
        amount: settlementAmount,
        gateway_fee: bFee,
        tax: bTax,
        net_amount: Math.round((settlementAmount - bFee - bTax) * 100) / 100,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);

      // Bank statement reflection
      sourceC.push({
        ...recordB,
        source_type: "BANK_STATEMENT",
      });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "MISMATCHED",
        expectedException: "AMOUNT_MISMATCH",
        expectedSeverity: diff > 5000 ? "HIGH" : "MEDIUM",
        notes: `Ground Truth: Internal ledger states ₹${amount.toLocaleString("en-IN")}, but Gateway settlement settled ₹${settlementAmount.toLocaleString("en-IN")}. Unexplained deduction of ₹${diff.toLocaleString("en-IN")}.`,
        differenceAmount: diff,
      });
    } else if (countMissing < targetMissing && i % 9 === 4) {
      // SCENARIO 2: Missing Record in Settlement Report (recorded internally but missing at gateway)
      countMissing++;
      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "MISSING",
        expectedException: "MISSING_TRANSACTION",
        expectedSeverity: "CRITICAL",
        notes: `Ground Truth: Transaction ${txnId} was logged in internal ledger, but no corresponding settlement was captured by Payment Gateway.`,
        differenceAmount: amount,
      });
      // Do not add to sourceB or sourceC!
    } else if (countDuplicates < targetDuplicates && i % 11 === 3) {
      // SCENARIO 3: Duplicate Transaction in Settlement
      countDuplicates++;
      const recordB: FinancialRecord = {
        ...recordA,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);

      // Add a duplicate record with identical reference and amount
      const duplicateTxnId = `${txnId}-DUP`;
      const duplicateRecordB: FinancialRecord = {
        ...recordB,
        transaction_id: duplicateTxnId,
        description: `DUPLICATE RETRY: ${description}`,
      };
      sourceB.push(duplicateRecordB);

      sourceC.push({
        ...recordB,
        source_type: "BANK_STATEMENT",
      });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "DUPLICATE",
        expectedException: "DUPLICATE_TRANSACTION",
        expectedSeverity: "HIGH",
        notes: `Ground Truth: Multiple settlement entries sharing reference ${refId} and amount ₹${amount.toLocaleString("en-IN")}. Probable webhook retry storm.`,
        differenceAmount: amount,
      });
    } else if (countFeeMismatch < targetFeeMismatch && i % 10 === 6) {
      // SCENARIO 4: Gateway Fee & Tax Discrepancy
      countFeeMismatch++;
      const feeDelta = Math.round((gatewayFee * 0.4 + 45) * 100) / 100;
      const bFee = gatewayFee + feeDelta;
      const bTax = Math.round(bFee * 0.18 * 100) / 100;

      const recordB: FinancialRecord = {
        ...recordA,
        gateway_fee: bFee,
        tax: bTax,
        net_amount: Math.round((amount - bFee - bTax) * 100) / 100,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);
      sourceC.push({ ...recordB, source_type: "BANK_STATEMENT" });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "MISMATCHED",
        expectedException: "FEE_MISMATCH",
        expectedSeverity: "LOW",
        notes: `Ground Truth: Principal amount ₹${amount.toLocaleString("en-IN")} matches, but Gateway processing fee of ₹${bFee} deviates from contractual rate ₹${gatewayFee} by ₹${feeDelta}.`,
        differenceAmount: feeDelta,
      });
    } else if (countDateMismatch < targetDateMismatch && i % 12 === 5) {
      // SCENARIO 5: Date / Settlement SLA Delay Mismatch
      countDateMismatch++;
      const delayedSettle = new Date(settleTime.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days extra
      const delayedDateStr = delayedSettle.toISOString().replace("T", " ").substring(0, 19);

      const recordB: FinancialRecord = {
        ...recordA,
        settlement_date: delayedDateStr,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);
      sourceC.push({ ...recordB, source_type: "BANK_STATEMENT" });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "PARTIALLY_MATCHED",
        expectedException: "DATE_MISMATCH",
        expectedSeverity: "MEDIUM",
        notes: `Ground Truth: Transaction matched on Amount and Reference, but settlement cleared with a 5-day SLA delay (${delayedDateStr} vs expected ${settleDateStr}).`,
        differenceAmount: 0,
      });
    } else if (countStatusMismatch < targetStatusMismatch && i % 14 === 7) {
      // SCENARIO 6: Status Mismatch (Internal Success vs Gateway Failed)
      countStatusMismatch++;
      const recordB: FinancialRecord = {
        ...recordA,
        status: "FAILED",
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "MISMATCHED",
        expectedException: "STATUS_MISMATCH",
        expectedSeverity: "CRITICAL",
        notes: `Ground Truth: Internal ledger marked transaction as SUCCESS, but payment gateway marked it as FAILED. Goods may have been fulfilled without captured payment.`,
        differenceAmount: amount,
      });
    } else if (countRefMismatch < targetRefMismatch && i % 15 === 8) {
      // SCENARIO 7: Reference ID Mismatch
      countRefMismatch++;
      const alteredRef = `REF-ERR-${999000 + i}`;
      const recordB: FinancialRecord = {
        ...recordA,
        reference_id: alteredRef,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);
      sourceC.push({ ...recordB, source_type: "BANK_STATEMENT" });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "PARTIALLY_MATCHED",
        expectedException: "REFERENCE_MISMATCH",
        expectedSeverity: "MEDIUM",
        notes: `Ground Truth: Amount and Settlement ID match, but Reference ID differs (${refId} vs ${alteredRef}). Requires level 3/4 heuristic resolution.`,
        differenceAmount: 0,
      });
    } else {
      // CLEAN GENUINE MATCH
      const recordB: FinancialRecord = {
        ...recordA,
        source_type: "GATEWAY_SETTLEMENT",
      };
      sourceB.push(recordB);
      sourceC.push({
        ...recordB,
        source_type: "BANK_STATEMENT",
      });

      groundTruth.set(txnId, {
        transaction_id: txnId,
        expectedStatus: "MATCHED",
        expectedException: "NONE",
        expectedSeverity: "LOW",
        notes: "Ground Truth: Exact match across Internal Ledger, Gateway Settlement, and Bank Statement.",
        differenceAmount: 0,
      });
    }
  }

  // Shuffle sourceB slightly so records are not in trivial 1:1 order (mimics real-world batch ingestion)
  for (let i = sourceB.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sourceB[i], sourceB[j]] = [sourceB[j], sourceB[i]];
  }

  const genuineMatches = recordCount - (
    countAmountMismatch +
    countMissing +
    countDuplicates +
    countFeeMismatch +
    countDateMismatch +
    countStatusMismatch +
    countRefMismatch
  );

  return {
    sourceA,
    sourceB,
    sourceC,
    groundTruth,
    summary: {
      totalRecords: recordCount,
      genuineMatches,
      amountMismatches: countAmountMismatch,
      missingRecords: countMissing,
      duplicateRecords: countDuplicates,
      feeDiscrepancies: countFeeMismatch,
      dateDiscrepancies: countDateMismatch,
      statusMismatches: countStatusMismatch,
      referenceMismatches: countRefMismatch,
    },
  };
}
