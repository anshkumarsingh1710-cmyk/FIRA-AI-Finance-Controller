export type PaymentMethod = "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "NET_BANKING" | "WALLET";

export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";

export interface FinancialRecord {
  transaction_id: string;
  reference_id: string;
  date: string;
  customer_name: string;
  description: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  settlement_id: string;
  gateway_fee: number;
  tax: number;
  net_amount: number;
  settlement_date: string;
  source_type: "INTERNAL_LEDGER" | "GATEWAY_SETTLEMENT" | "BANK_STATEMENT";
}

export type MatchStatus =
  | "MATCHED"
  | "PARTIALLY_MATCHED"
  | "MISMATCHED"
  | "MISSING"
  | "DUPLICATE"
  | "UNRESOLVED";

export type ExceptionType =
  | "NONE"
  | "AMOUNT_MISMATCH"
  | "DATE_MISMATCH"
  | "FEE_MISMATCH"
  | "TAX_MISMATCH"
  | "STATUS_MISMATCH"
  | "MISSING_TRANSACTION"
  | "DUPLICATE_TRANSACTION"
  | "REFERENCE_MISMATCH"
  | "SETTLEMENT_MISMATCH"
  | "PARTIAL_MATCH"
  | "UNRESOLVED";

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface GroundTruthScenario {
  transaction_id: string;
  expectedStatus: MatchStatus;
  expectedException: ExceptionType;
  expectedSeverity: SeverityLevel;
  notes: string;
  differenceAmount?: number;
}

export interface ReconciledRecord {
  id: string;
  transaction_id: string;
  reference_id: string;
  date: string;
  customer_name: string;
  amount: number;
  currency: string;
  match_status: MatchStatus;
  match_level: "LEVEL_1_EXACT_TXN" | "LEVEL_2_EXACT_REF" | "LEVEL_3_SETTLEMENT_ID" | "LEVEL_4_HEURISTIC" | "LEVEL_5_FUZZY" | "NONE";
  confidence: number; // 0 to 100
  difference_amount: number;
  difference_type: string;
  source_a?: FinancialRecord;
  source_b?: FinancialRecord;
  source_c?: FinancialRecord;
  exception_type: ExceptionType;
  severity: SeverityLevel;
  rule_failed?: string;
  explanation: string;
  recommended_action: string;
  ground_truth?: GroundTruthScenario;
  is_correct_prediction?: boolean;
  status: TransactionStatus;
  resolved: boolean;
}

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  exactMatchRate: number;
  partialMatchRate: number;
  mismatchedRecords: number;
  missingRecords: number;
  duplicateRecords: number;
  unresolvedRecords: number;
  totalExceptions: number;
  matchRate: number; // Matched / Total * 100
  exceptionRate: number;
  unresolvedRate: number;
  totalReconciledValue: number;
  totalExceptionValue: number;
  unresolvedValue: number;
  
  // Measured Accuracy against ground truth
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;

  // Throughput
  processingTimeMs: number;
  recordsProcessed: number;
  throughput: number; // records / second
}

export interface CashPositionMetrics {
  grossTransactionValue: number;
  totalFees: number;
  totalTaxes: number;
  unresolvedAmounts: number;
  estimatedNetPosition: number;
  pendingSettlements: number;
  expectedSettlementValue: number;
  exceptionExposure: number;
}

export interface FinancialAnalyticsSummary {
  totalTransactionValue: number;
  totalSettledValue: number;
  totalFees: number;
  totalTax: number;
  totalNetValue: number;
  avgTransactionValue: number;
  largestTransaction: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  exceptionCount: number;
  volumeOverTime: { date: string; volume: number; value: number; matchedValue: number; exceptionValue: number }[];
  statusDistribution: { status: string; count: number; value: number }[];
  exceptionDistribution: { type: string; count: number; value: number; color: string }[];
  paymentMethodDistribution: { method: string; count: number; value: number }[];
}

export interface AnomalyItem {
  id: string;
  transaction_id: string;
  type: "HIGH_VALUE_OUTLIER" | "UNUSUAL_FEE_RATIO" | "SETTLEMENT_DELAY" | "DUPLICATE_SPIKE" | "OFF_PEAK_FREQUENCY";
  severity: SeverityLevel;
  metric: string;
  value: string;
  threshold: string;
  description: string;
  record?: ReconciledRecord;
  aiExplanation?: string;
  isAnalyzing?: boolean;
}

export interface AIExceptionAnalysis {
  whatHappened: string;
  whatIsDifferent: string;
  possibleCause: string;
  financialImpact: string;
  confidence: string;
  recommendedAction: string;
  autoResolutionRecommendation: string;
}
