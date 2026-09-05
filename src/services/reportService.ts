import {
  CashPositionMetrics,
  FinancialAnalyticsSummary,
  ReconciledRecord,
  ReconciliationMetrics,
} from "../types";

export function exportReconciliationToCSV(records: ReconciledRecord[]): void {
  const headers = [
    "Transaction ID",
    "Reference ID",
    "Date",
    "Customer / Merchant",
    "Amount (INR)",
    "Match Status",
    "Match Level",
    "Confidence (%)",
    "Exception Type",
    "Severity",
    "Difference Amount (INR)",
    "Difference Type",
    "Rule Failed",
    "Source A Amount",
    "Source B Amount",
    "Ground Truth Status",
    "Prediction Verified",
    "Recommended Action",
  ];

  const rows = records.map((r) => [
    r.transaction_id,
    r.reference_id,
    `"${r.date}"`,
    `"${r.customer_name}"`,
    r.amount,
    r.match_status,
    r.match_level,
    r.confidence,
    r.exception_type,
    r.severity,
    r.difference_amount,
    r.difference_type,
    `"${(r.rule_failed || "").replace(/"/g, '""')}"`,
    r.source_a?.amount ?? "N/A",
    r.source_b?.amount ?? "N/A",
    r.ground_truth?.expectedStatus ?? "N/A",
    r.is_correct_prediction ? "YES" : "NO",
    `"${(r.recommended_action || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `FIRA_Reconciliation_Report_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getSampleSourceACSV(): string {
  return [
    "transaction_id,reference_id,date,customer_name,description,amount,currency,payment_method,status,settlement_id,gateway_fee,tax,net_amount,settlement_date",
    "TXN-A-1001,REF-IND-800001,2026-08-20 09:28:00,ABC Technologies,Enterprise Cloud SaaS,12500,INR,UPI,SUCCESS,SETTLE-B26-400001,50.00,9.00,12441.00,2026-08-22 09:28:00",
    "TXN-A-1002,REF-IND-800002,2026-08-20 09:56:00,Nova Retail,Retail Checkout Order,8450,INR,CREDIT_CARD,SUCCESS,SETTLE-B26-400002,185.90,33.46,8230.64,2026-08-22 09:56:00",
    "TXN-A-1003,REF-IND-800003,2026-08-20 10:24:00,UrbanMart,Grocery Bulk Pack,3200,INR,DEBIT_CARD,SUCCESS,SETTLE-B26-400003,57.60,10.37,3132.03,2026-08-22 10:24:00",
    "TXN-A-1004,REF-IND-800004,2026-08-20 11:15:00,Zenith Systems,Quarterly Server Hosting,45000,INR,NET_BANKING,SUCCESS,SETTLE-B26-400004,675.00,121.50,44203.50,2026-08-22 11:15:00",
    "TXN-A-1005,REF-IND-800005,2026-08-20 12:40:00,Kavita Sharma,Direct Consumer Order,1800,INR,UPI,SUCCESS,SETTLE-B26-400005,7.20,1.30,1791.50,2026-08-22 12:40:00",
  ].join("\n");
}

export function getSampleSourceBCSV(): string {
  return [
    "transaction_id,reference_id,date,customer_name,description,amount,currency,payment_method,status,settlement_id,gateway_fee,tax,net_amount,settlement_date",
    "TXN-B-1001,REF-IND-800001,2026-08-20 09:28:00,ABC Technologies,Enterprise Cloud SaaS,12500,INR,UPI,SUCCESS,SETTLE-B26-400001,50.00,9.00,12441.00,2026-08-22 09:28:00",
    "TXN-B-1002,REF-IND-800002,2026-08-20 09:56:00,Nova Retail,Retail Checkout Order,8450,INR,CREDIT_CARD,SUCCESS,SETTLE-B26-400002,185.90,33.46,8230.64,2026-08-22 09:56:00",
    "TXN-B-1003,REF-IND-800003,2026-08-20 10:24:00,UrbanMart,Grocery Bulk Pack,3200,INR,DEBIT_CARD,SUCCESS,SETTLE-B26-400003,57.60,10.37,3132.03,2026-08-22 10:24:00",
    "TXN-B-1004,REF-IND-800004,2026-08-20 11:15:00,Zenith Systems,Quarterly Server Hosting,45000,INR,NET_BANKING,SUCCESS,SETTLE-B26-400004,780.00,140.40,44079.60,2026-08-22 11:15:00",
    "TXN-B-1005,REF-IND-800005,2026-08-20 12:40:00,Kavita Sharma,Direct Consumer Order,1800,INR,UPI,SUCCESS,SETTLE-B26-400005,7.20,1.30,1791.50,2026-08-22 12:40:00",
  ].join("\n");
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSampleSourceA(): void {
  triggerDownload(getSampleSourceACSV(), "FIRA_Sample_Source_A_ERP_Ledger.csv");
}

export function downloadSampleSourceB(): void {
  triggerDownload(getSampleSourceBCSV(), "FIRA_Sample_Source_B_Gateway_Settlement.csv");
}

export function exportSampleCSVTemplates(): void {
  downloadSampleSourceA();
  setTimeout(() => {
    downloadSampleSourceB();
  }, 350);
}
