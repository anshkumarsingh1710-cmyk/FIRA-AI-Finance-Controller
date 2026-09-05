import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient helper with fallback for transient 503/high-demand errors
async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  try {
    return await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: params.contents,
      config: params.config,
    });
  } catch (err: any) {
    const isHighDemand =
      err?.status === 503 ||
      err?.code === 503 ||
      String(err?.message || "").includes("503") ||
      String(err?.message || "").includes("high demand") ||
      String(err?.message || "").includes("UNAVAILABLE");

    if (isHighDemand) {
      console.log("Gemini 3.8 high demand detected; trying secondary model...");
      try {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: params.contents,
          config: params.config,
        });
      } catch (fallbackErr) {
        throw err;
      }
    }
    throw err;
  }
}

// Health check
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== "" &&
      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: hasKey,
  });
});

// AI Exception Analyst endpoint
app.post("/api/gemini/analyze-exception", async (req, res) => {
  const {
    transactionId,
    exceptionType,
    severity,
    differenceAmount,
    differenceType,
    sourceA,
    sourceB,
    ruleFailed,
    context,
  } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful deterministic fallback when API key is not configured
    return res.json({
      success: true,
      source: "deterministic_fallback",
      analysis: generateDeterministicExceptionAnalysis({
        transactionId,
        exceptionType,
        severity,
        differenceAmount,
        differenceType,
        sourceA,
        sourceB,
        ruleFailed,
      }),
      notice:
        "AI explanation powered by deterministic controller logic (Gemini API key not active). All reconciliation calculations remain 100% verified.",
    });
  }

  try {
    const prompt = `You are FIRA, an AI Finance Controller for a high-volume payment processor and enterprise merchant operations.
Analyze this reconciliation exception between Source A (Internal Ledger) and Source B (Payment Gateway / Settlement).

CRITICAL INSTRUCTIONS:
- Reason ONLY from the facts provided below.
- Do NOT invent numbers, dates, references, or external transactions.
- Never present speculation as undisputed fact.
- If evidence is insufficient to identify the exact cause, explicitly state: "Insufficient evidence to resolve automatically."
- Return a clear, professional finance controller evaluation formatted as JSON with the exact keys:
  "whatHappened", "whatIsDifferent", "possibleCause", "financialImpact", "confidence", "recommendedAction", "autoResolutionRecommendation"

DATA:
Transaction ID: ${transactionId}
Exception Type: ${exceptionType}
Severity: ${severity}
Difference Amount: ₹${differenceAmount} (${differenceType})
Rule Triggered: ${ruleFailed}
Source A (Internal Ledger): ${JSON.stringify(sourceA)}
Source B (Gateway / Settlement): ${JSON.stringify(sourceB || "None / Record Missing")}
Additional Context: ${context || "Standard reconciliation batch"}

FORMAT REQUIREMENTS:
Respond ONLY with valid JSON matching this schema:
{
  "whatHappened": "string summary",
  "whatIsDifferent": "specific delta breakdown",
  "possibleCause": "factual hypothesis based only on the evidence",
  "financialImpact": "monetary exposure and accounting treatment",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "recommendedAction": "step-by-step controller investigation steps",
  "autoResolutionRecommendation": "Can it be auto-resolved or requires manual intervention?"
}`;

    const response = await generateContentWithResilience(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      source: "gemini",
      analysis: parsed,
    });
  } catch (error: any) {
    console.log("Using deterministic controller analysis for exception:", error?.message || error);
    // Graceful fallback to deterministic controller response so app never breaks
    return res.json({
      success: true,
      source: "fallback_on_error",
      analysis: generateDeterministicExceptionAnalysis({
        transactionId,
        exceptionType,
        severity,
        differenceAmount,
        differenceType,
        sourceA,
        sourceB,
        ruleFailed,
      }),
      notice:
        "AI explanation temporarily unavailable. Deterministic reconciliation results remain available.",
    });
  }
});

// AI Executive Summary endpoint
app.post("/api/gemini/executive-summary", async (req, res) => {
  const { metrics, exceptionBreakdown, topExceptions, cashPosition } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      success: true,
      source: "deterministic_fallback",
      summary: generateDeterministicExecutiveSummary(metrics, exceptionBreakdown, cashPosition),
      notice: "Executive summary generated by deterministic controller rules.",
    });
  }

  try {
    const prompt = `You are FIRA, an AI Finance Controller. Write a concise, authoritative executive summary for the CFO and finance operations team based on this automated reconciliation run.

CRITICAL INSTRUCTIONS:
- You must ONLY use the provided figures. Never fabricate amounts, percentages, or records.
- Be direct, professional, and audit-ready.
- Keep the summary to 3-4 structured paragraphs:
  1. High-level reconciliation outcome (total records, match rate, verified accuracy).
  2. Primary exception drivers and total financial exposure at risk.
  3. Actionable controller directives for the finance team.

DATA:
Metrics:
- Total Processed: ${metrics.totalRecords}
- Matched Records: ${metrics.matchedRecords} (${metrics.matchRate.toFixed(1)}%)
- Exceptions Detected: ${metrics.totalExceptions}
- Verified Accuracy: ${metrics.accuracy.toFixed(1)}% (Precision: ${metrics.precision.toFixed(1)}%, Recall: ${metrics.recall.toFixed(1)}%)
- Total Reconciled Value: ₹${metrics.totalReconciledValue?.toLocaleString("en-IN")}
- Financial Value at Risk (Exceptions): ₹${metrics.totalExceptionValue?.toLocaleString("en-IN")}
- Unresolved Exposure: ₹${metrics.unresolvedValue?.toLocaleString("en-IN")}
- Processing Throughput: ${metrics.throughput.toFixed(1)} records/sec in ${metrics.processingTimeMs}ms

Exception Breakdown:
${JSON.stringify(exceptionBreakdown, null, 2)}

Cash Position Summary:
- Gross GMV: ₹${cashPosition?.grossTransactionValue?.toLocaleString("en-IN")}
- Settled Net Position: ₹${cashPosition?.estimatedNetPosition?.toLocaleString("en-IN")}
- Exception Exposure: ₹${cashPosition?.exceptionExposure?.toLocaleString("en-IN")}

Key High-Priority Exceptions:
${JSON.stringify(topExceptions, null, 2)}

Provide your executive brief directly.`;

    const response = await generateContentWithResilience(ai, {
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return res.json({
      success: true,
      source: "gemini",
      summary: response.text,
    });
  } catch (error: any) {
    console.log("Using deterministic controller executive summary fallback:", error?.message || error);
    return res.json({
      success: true,
      source: "fallback_on_error",
      summary: generateDeterministicExecutiveSummary(metrics, exceptionBreakdown, cashPosition),
      notice: "AI explanation unavailable. Deterministic reconciliation results remain available.",
    });
  }
});

// AI Anomaly Explanation endpoint
app.post("/api/gemini/explain-anomaly", async (req, res) => {
  const { anomaly, datasetStats } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      success: true,
      source: "deterministic_fallback",
      explanation: generateDeterministicAnomalyExplanation(anomaly),
    });
  }

  try {
    const prompt = `You are FIRA, an AI Finance Controller.
Provide a concise controller analysis of this detected statistical anomaly in our transaction ledger:

Anomaly:
Type: ${anomaly.type}
Severity: ${anomaly.severity}
Metric: ${anomaly.metric}
Observed Value: ${anomaly.value}
Threshold / Baseline: ${anomaly.threshold}
Description: ${anomaly.description}

Context:
Dataset Sample Size: ${datasetStats?.sampleSize || "Batch Run"}
Average Transaction: ₹${datasetStats?.avgAmount || "N/A"}

Explain:
1. Operational Risk Assessment
2. Why this deviation triggered financial controls
3. Immediate controller recommendation

Keep the response concise (2 short paragraphs). Reason strictly from the provided numbers.`;

    const response = await generateContentWithResilience(ai, {
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return res.json({
      success: true,
      source: "gemini",
      explanation: response.text,
    });
  } catch (error: any) {
    return res.json({
      success: true,
      source: "fallback_on_error",
      explanation: generateDeterministicAnomalyExplanation(anomaly),
    });
  }
});

// Deterministic Helper Functions
function generateDeterministicExceptionAnalysis(params: any) {
  const {
    transactionId,
    exceptionType,
    severity,
    differenceAmount,
    differenceType,
    sourceA,
    sourceB,
    ruleFailed,
  } = params;

  const diffStr = differenceAmount ? `₹${Number(differenceAmount).toLocaleString("en-IN")}` : "None";

  let whatHappened = "";
  let whatIsDifferent = "";
  let possibleCause = "";
  let financialImpact = "";
  let recommendedAction = "";
  let autoResolution = "Manual controller review required.";

  switch (exceptionType) {
    case "AMOUNT_MISMATCH":
      whatHappened = `Transaction ${transactionId} exhibits an amount mismatch between internal ledger and payment gateway settlement.`;
      whatIsDifferent = `Ledger record indicates ₹${sourceA?.amount?.toLocaleString("en-IN") || "0"}, while settlement shows ₹${sourceB?.amount?.toLocaleString("en-IN") || "0"} (Discrepancy: ${diffStr} ${differenceType}).`;
      possibleCause = `Potential partial refund deduction, unauthorized surcharge, or gateway currency conversion variance.`;
      financialImpact = `Direct variance of ${diffStr} requiring ledger rebalancing or gateway dispute filing.`;
      recommendedAction = `Review gateway settlement breakdown for MDR deductions, verify customer invoice, and adjust unallocated revenue reserves.`;
      break;
    case "MISSING_TRANSACTION":
      whatHappened = `Transaction ${transactionId} exists in the internal ledger but is completely absent from the payment gateway settlement report.`;
      whatIsDifferent = `Source A has recorded ₹${sourceA?.amount?.toLocaleString("en-IN") || "0"}, but Source B has 0 corresponding records.`;
      possibleCause = `Failed payment webhook, merchant order drop before gateway capture, or settlement cycle cut-off lag (T+2 window).`;
      financialImpact = `Potential uncollected revenue of ₹${sourceA?.amount?.toLocaleString("en-IN") || "0"}. Cash position reflects credit without settlement.`;
      recommendedAction = `Query payment gateway API using reference ID ${sourceA?.reference_id || transactionId} to determine charge status (Authorized vs Failed).`;
      break;
    case "DUPLICATE_TRANSACTION":
      whatHappened = `Multiple transactions share identical payment references or settlement IDs, resulting in duplicate ledger entries.`;
      whatIsDifferent = `Duplicate capture identified for reference ${sourceA?.reference_id || transactionId} with cumulative value exposure of ${diffStr}.`;
      possibleCause = `Client-side retry without idempotency key or double webhook invocation from payment provider.`;
      financialImpact = `Overstated gross revenue and duplicate customer billing risk of ${diffStr}.`;
      recommendedAction = `Inspect idempotent request logs, verify whether dual charge hit the customer account, and prepare reversal adjustment if confirmed.`;
      break;
    case "FEE_MISMATCH":
      whatHappened = `Payment gateway processing fee charged deviates from agreed contractual rate.`;
      whatIsDifferent = `Calculated fee ₹${sourceA?.gateway_fee?.toFixed(2) || "0"} vs charged fee ₹${sourceB?.gateway_fee?.toFixed(2) || "0"} (Variance: ${diffStr}).`;
      possibleCause = `Commercial tier misalignment, international card interchange surcharge, or GST on gateway fee miscalculation.`;
      financialImpact = `Operational expense erosion of ${diffStr} over batch volume.`;
      recommendedAction = `Audit gateway rate agreement schedule for card brand / payment method and request fee adjustment credit note.`;
      break;
    case "DATE_MISMATCH":
      whatHappened = `Transaction authorization date precedes or diverges significantly from settlement processing date.`;
      whatIsDifferent = `Ledger timestamp: ${sourceA?.date || "N/A"} vs Settlement timestamp: ${sourceB?.date || sourceB?.settlement_date || "N/A"}.`;
      possibleCause = `Weekend/bank holiday settlement delay or delayed batch capture window.`;
      financialImpact = `Working capital float timing variance; no net loss if principal matches.`;
      recommendedAction = `Verify banking clearing holiday calendar and match under T+2 / T+3 settlement SLA.`;
      autoResolution = "Can be auto-matched once timing window threshold is verified.";
      break;
    case "STATUS_MISMATCH":
      whatHappened = `Transaction state inconsistency between internal order ledger and gateway status.`;
      whatIsDifferent = `Ledger status: ${sourceA?.status || "UNKNOWN"} vs Gateway status: ${sourceB?.status || "UNKNOWN"}.`;
      possibleCause = `Late status webhook delivery or customer cancellation post-authorization.`;
      financialImpact = `Revenue recognition mismatch; order may have been fulfilled without secured payment.`;
      recommendedAction = `Synchronize order status with gateway capture state. If goods were dispatched on failed status, initiate recovery.`;
      break;
    default:
      whatHappened = `Reconciliation rule failed: ${ruleFailed || "Data parity threshold not met"}.`;
      whatIsDifferent = `Record variance of ${diffStr} observed between ledger and settlement files.`;
      possibleCause = `Insufficient evidence in the uploaded records to definitively attribute root cause without additional metadata.`;
      financialImpact = `Financial value at risk: ${diffStr}.`;
      recommendedAction = `Conduct manual ledger tie-out and request raw processor statement logs.`;
      break;
  }

  return {
    whatHappened,
    whatIsDifferent,
    possibleCause,
    financialImpact,
    confidence: severity === "CRITICAL" ? "HIGH" : "MEDIUM",
    recommendedAction,
    autoResolutionRecommendation: autoResolution,
  };
}

function generateDeterministicExecutiveSummary(metrics: any, breakdown: any, cashPosition: any) {
  const matchRate = metrics?.matchRate?.toFixed(1) || "0";
  const accuracy = metrics?.accuracy?.toFixed(1) || "0";
  const total = metrics?.totalRecords || 0;
  const matched = metrics?.matchedRecords || 0;
  const exceptions = metrics?.totalExceptions || 0;
  const exposure = Number(metrics?.totalExceptionValue || 0).toLocaleString("en-IN");
  const reconciled = Number(metrics?.totalReconciledValue || 0).toLocaleString("en-IN");

  return `FIRA Finance Controller Reconciliation Run completed over ${total} transactions. The deterministic engine successfully reconciled ${matched} records with a verified match rate of ${matchRate}% and an accuracy benchmark of ${accuracy}% against ground-truth validation.

A total of ${exceptions} exceptions were surfaced across all sources, representing ₹${exposure} in financial value at risk. The primary exception category observed was ${
    breakdown?.[0]?.type?.replace(/_/g, " ") || "amount mismatches"
  }, accounting for the largest share of settlement discrepancies. Total verified reconciled value stands at ₹${reconciled}.

Controller Directives: Prioritize manual investigation on high-severity amount mismatches and missing settlement entries. Verify gateway MDR deduction schedules against merchant rate cards to close fee variances. Reconcile pending T+2 clearing batches before closing daily cash position.`;
}

function generateDeterministicAnomalyExplanation(anomaly: any) {
  return `The deterministic anomaly engine detected a ${anomaly.severity?.toLowerCase() || "medium"} severity flag for "${anomaly.metric}": observed value of ${anomaly.value} breaches the statistical control threshold (${anomaly.threshold}).

Operational Assessment: This variance represents an abnormal transaction behavior outside 2 standard deviations or IQR bounds. Finance operations should review whether this stems from bulk merchant batch processing, seasonal promo traffic, or unvalidated gateway retries.`;
}

// Start Server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIRA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
