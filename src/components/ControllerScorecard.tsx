import React from "react";
import { ReconciliationMetrics } from "../types";
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Clock,
  Coins,
} from "lucide-react";

interface ControllerScorecardProps {
  metrics: ReconciliationMetrics;
  resolvedCount: number;
}

export const ControllerScorecard: React.FC<ControllerScorecardProps> = ({
  metrics,
  resolvedCount,
}) => {
  const unresolvedExceptions = Math.max(0, metrics.totalExceptions - resolvedCount);

  return (
    <div
      id="controller-scorecard"
      className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-5 sm:p-6 relative overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
              Controller Scorecard
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-blue-400 border border-zinc-700">
              Verified Metrics
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated compliance & accuracy verification against known ground truth
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Throughput: <strong className="text-white font-mono">{metrics.throughput.toFixed(1)}</strong> rec/sec</span>
        </div>
      </div>

      {/* 12 Core Controller Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Match Rate */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Match Rate
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {metrics.matchRate.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            {metrics.matchedRecords} / {metrics.totalRecords} records
          </span>
        </div>

        {/* Metric 2: Reconciliation Accuracy */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Accuracy (GT)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-blue-400">
              {metrics.accuracy.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Verified ground truth
          </span>
        </div>

        {/* Metric 3: Precision */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Precision
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-cyan-400">
              {metrics.precision.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            TP / (TP + FP)
          </span>
        </div>

        {/* Metric 4: Recall */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Recall
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {metrics.recall.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            TP / (TP + FN)
          </span>
        </div>

        {/* Metric 5: Records Processed */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Processed
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#fafafa]">
              {metrics.totalRecords}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            In {metrics.processingTimeMs.toFixed(0)} ms
          </span>
        </div>

        {/* Metric 6: Exceptions Detected */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Exceptions
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-red-400">
              {metrics.totalExceptions}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            {metrics.exceptionRate.toFixed(1)}% exception rate
          </span>
        </div>

        {/* Metric 7: Exceptions Resolved */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Resolved
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-300">
              {resolvedCount}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Closed in session
          </span>
        </div>

        {/* Metric 8: Exceptions Unresolved */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Unresolved
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-red-400">
              {unresolvedExceptions}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Requires review
          </span>
        </div>

        {/* Metric 9: Financial Value Reconciled */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Value Reconciled
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{(metrics.totalReconciledValue / 1000).toFixed(1)}k
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
            ₹{metrics.totalReconciledValue.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Metric 10: Value at Risk */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Value at Risk
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-red-400">
              ₹{(metrics.totalExceptionValue / 1000).toFixed(1)}k
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
            ₹{metrics.totalExceptionValue.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Metric 11: Processing Time */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Processing Time
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-zinc-200">
              {metrics.processingTimeMs.toFixed(1)}
              <span className="text-xs text-zinc-500 font-sans ml-1">ms</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Deterministic engine
          </span>
        </div>

        {/* Metric 12: Processing Throughput */}
        <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 hover:border-zinc-700 transition">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Throughput
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-blue-400">
              {metrics.throughput.toFixed(0)}
              <span className="text-xs text-zinc-500 font-sans ml-1">r/s</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Scales to 50k+
          </span>
        </div>
      </div>
    </div>
  );
};
