import React, { useState } from "react";
import { AIExceptionAnalysis, ReconciledRecord } from "../types";
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Layers,
} from "lucide-react";

interface ExceptionDetailDrawerProps {
  record: ReconciledRecord | null;
  onClose: () => void;
  onResolve: (transactionId: string) => void;
}

export const ExceptionDetailDrawer: React.FC<ExceptionDetailDrawerProps> = ({
  record,
  onClose,
  onResolve,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIExceptionAnalysis | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  if (!record) return null;

  const handleAnalyzeWithGemini = async () => {
    setIsAnalyzing(true);
    setAnalysisNotice(null);
    try {
      const response = await fetch("/api/gemini/analyze-exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: record.transaction_id,
          exceptionType: record.exception_type,
          severity: record.severity,
          differenceAmount: record.difference_amount,
          differenceType: record.difference_type,
          sourceA: record.source_a,
          sourceB: record.source_b,
          ruleFailed: record.rule_failed,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        if (data.notice) {
          setAnalysisNotice(data.notice);
        }
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      // Fallback deterministic response
      setAiAnalysis({
        whatHappened: `Transaction ${record.transaction_id} discrepancy detected during deterministic multi-source reconciliation.`,
        whatIsDifferent: `Variance of ₹${record.difference_amount.toLocaleString("en-IN")} between internal ledger and settlement reports.`,
        possibleCause: "Settlement deduction, fee surcharge variance, or payment lifecycle cutoff delay.",
        financialImpact: `Monetary exposure of ₹${record.difference_amount.toLocaleString("en-IN")} requiring reconciliation ledger adjustment.`,
        confidence: "HIGH",
        recommendedAction: record.recommended_action || "Audit merchant rate cards and cross-verify with bank settlement statement.",
        autoResolutionRecommendation: "Manual controller investigation recommended.",
      });
      setAnalysisNotice("AI explanation unavailable. Deterministic reconciliation results remain available.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div
        className="w-full max-w-2xl bg-[#09090b] text-[#fafafa] border-l border-zinc-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {record.transaction_id}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(record.severity)}`}>
                  {record.severity}
                </span>
                {record.resolved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> RESOLVED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {record.customer_name} · {record.exception_type.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!record.resolved && (
              <button
                id="btn-resolve-exception"
                onClick={() => onResolve(record.transaction_id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Source Comparison Card */}
          <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Source Comparison
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Source A */}
              <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800/80">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                  Source A: Internal Ledger
                </span>
                <div className="text-lg font-bold font-mono text-white">
                  ₹{record.source_a?.amount?.toLocaleString("en-IN") || "0"}
                </div>
                <div className="text-xs text-zinc-400 mt-2 space-y-1">
                  <div>Ref: <span className="font-mono text-zinc-300">{record.reference_id}</span></div>
                  <div>Status: <span className="font-semibold text-zinc-300">{record.source_a?.status || "N/A"}</span></div>
                  <div>Fee: <span className="font-mono text-zinc-300">₹{record.source_a?.gateway_fee?.toFixed(2) || "0"}</span></div>
                  <div>Date: <span className="text-zinc-300 text-[11px]">{record.source_a?.date || "N/A"}</span></div>
                </div>
              </div>

              {/* Source B */}
              <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800/80">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                  Source B: Gateway Settlement
                </span>
                {record.source_b ? (
                  <>
                    <div className="text-lg font-bold font-mono text-white">
                      ₹{record.source_b.amount?.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-zinc-400 mt-2 space-y-1">
                      <div>Ref: <span className="font-mono text-zinc-300">{record.source_b.reference_id}</span></div>
                      <div>Status: <span className="font-semibold text-zinc-300">{record.source_b.status}</span></div>
                      <div>Fee: <span className="font-mono text-zinc-300">₹{record.source_b.gateway_fee?.toFixed(2)}</span></div>
                      <div>Settled: <span className="text-zinc-300 text-[11px]">{record.source_b.settlement_date || "N/A"}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-red-400 text-xs font-semibold py-4 flex flex-col items-center justify-center">
                    <ShieldAlert className="w-6 h-6 mb-1 opacity-70" />
                    Record Missing in Settlement
                  </div>
                )}
              </div>
            </div>

            {/* Difference callout */}
            <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Identified Discrepancy:</span>
              <span className="font-mono font-bold text-yellow-400">
                {record.difference_amount > 0
                  ? `₹${record.difference_amount.toLocaleString("en-IN")} (${record.difference_type})`
                  : "Metadata / Timing Divergence"}
              </span>
            </div>
          </div>

          {/* Rule Triggered & Ground Truth Note */}
          <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                Deterministic Rule Triggered
              </span>
              <p className="text-xs font-mono text-zinc-300 bg-black/60 p-2 rounded border border-zinc-800">
                {record.rule_failed || "RULE_UNRESOLVED_PARITY"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Deterministic Controller Explanation
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {record.explanation}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Standard Recommended Action
              </span>
              <p className="text-xs text-zinc-300">
                {record.recommended_action}
              </p>
            </div>

            {record.ground_truth && (
              <div className="pt-2 border-t border-zinc-800 text-[11px] text-blue-300/90 flex items-start gap-1.5">
                <FileCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                <span>{record.ground_truth.notes}</span>
              </div>
            )}
          </div>

          {/* AI EXCEPTION ANALYST SECTION */}
          <div className="bg-[#0a0f1a] rounded-xl p-4 border border-blue-900/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Exception Analyst (Gemini)
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    High-level controller reasoning without arithmetic speculation
                  </p>
                </div>
              </div>

              <button
                id="btn-analyze-with-gemini"
                onClick={handleAnalyzeWithGemini}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isAnalyzing ? "Analyzing..." : "Analyze with Gemini"}</span>
              </button>
            </div>

            {analysisNotice && (
              <div className="mb-3 text-[11px] px-3 py-1.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300">
                {analysisNotice}
              </div>
            )}

            {aiAnalysis ? (
              <div className="space-y-3 mt-3 animate-in fade-in duration-200 text-xs">
                <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                  <span className="font-bold text-zinc-400 text-[10px] uppercase block mb-1">
                    WHAT HAPPENED?
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{aiAnalysis.whatHappened}</p>
                </div>

                <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                  <span className="font-bold text-zinc-400 text-[10px] uppercase block mb-1">
                    WHAT IS DIFFERENT?
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{aiAnalysis.whatIsDifferent}</p>
                </div>

                <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                  <span className="font-bold text-yellow-400 text-[10px] uppercase block mb-1">
                    POSSIBLE CAUSE
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{aiAnalysis.possibleCause}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                    <span className="font-bold text-red-400 text-[10px] uppercase block mb-1">
                      FINANCIAL IMPACT
                    </span>
                    <p className="text-zinc-200 leading-relaxed">{aiAnalysis.financialImpact}</p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                    <span className="font-bold text-blue-400 text-[10px] uppercase block mb-1">
                      CONFIDENCE
                    </span>
                    <p className="text-zinc-200 font-semibold">{aiAnalysis.confidence}</p>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                  <span className="font-bold text-emerald-400 text-[10px] uppercase block mb-1">
                    RECOMMENDED ACTION
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{aiAnalysis.recommendedAction}</p>
                </div>

                <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                  <span className="font-bold text-blue-400 text-[10px] uppercase block mb-1">
                    AUTO-RESOLUTION RECOMMENDATION
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{aiAnalysis.autoResolutionRecommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-zinc-400 text-xs">
                Click <strong className="text-blue-300">"Analyze with Gemini"</strong> to generate structured controller reasoning on root cause, financial impact, and resolution directives.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 text-xs flex justify-between items-center text-zinc-400">
          <span>Confidence Score: <strong className="text-white font-mono">{record.confidence}%</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
