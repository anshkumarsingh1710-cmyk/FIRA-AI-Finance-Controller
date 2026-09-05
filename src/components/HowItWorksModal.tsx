import React from "react";
import {
  X,
  ShieldCheck,
  Cpu,
  Sparkles,
  GitCompare,
  Database,
  Layers,
  Lock,
  CheckCircle2,
} from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-[#09090b] border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 text-zinc-300 text-xs"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                How FIRA Works: Architecture & Trust
              </h2>
              <p className="text-[11px] text-zinc-400">
                Transparent multi-level reconciliation, statistical anomaly detection, and controlled AI reasoning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Non-Execution Safe Guarantee */}
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-yellow-300 text-xs mb-1">
              STRICT ANALYSIS-ONLY ARCHITECTURE · ZERO TRANSACTION EXECUTION
            </span>
            <p className="text-[11px] leading-relaxed text-yellow-200/90">
              FIRA is an AI Finance Controller designed to analyze financial records, detect reconciliation discrepancies, and explain exceptions. FIRA is ANALYSIS ONLY and never initiates payments, refunds, bank transfers, trades, withdrawals, or financial transactions. No money-movement API keys or execution endpoints exist.
            </p>
          </div>
        </div>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pillar 1 */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>1. Data Ingestion & Normalization</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              FIRA ingests internal ERP general ledgers (Source A), payment gateway settlements (Source B, e.g. Razorpay), and bank clearing statements (Source C). Primary and secondary keys are normalized for cross-source tie-out.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <GitCompare className="w-4 h-4" />
              <span>2. Deterministic Matching Engine</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              All calculations and comparisons are strictly deterministic. Multi-level matching rules evaluate Exact Txn ID, Exact Reference ID, Settlement ID, and Date/Amount heuristics. Gemini is NEVER used for arithmetic or basic matching.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>3. Statistical Anomaly Detection</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Mathematical algorithms (Z-score, Interquartile Range, SLA lag variance, fee ratio bounds) monitor for high-value outliers, unusual gateway fees, and idempotency webhook collisions.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>4. AI Controller Explanations (Gemini)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Google Gemini is invoked exclusively for high-level qualitative controller reasoning: synthesizing root causes, evaluating financial risk, and drafting audit-ready executive memos. Grounded in verified facts.
            </p>
          </div>
        </div>

        {/* Verification Methodology */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <span className="font-bold text-zinc-200 block text-xs">
            Hackathon Verification & Ground Truth Benchmark
          </span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Every synthetic demo dataset embeds ground truth scenario tags (matches, missing records, amount differences, duplicate charges, fee variances). FIRA evaluates its own predictions against ground truth to produce transparent, reproducible Accuracy, Precision, and Recall scores.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Built for Razorpay AI Buildathon · Track 04: AI Finance Controller
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
