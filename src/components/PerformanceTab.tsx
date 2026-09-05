import React, { useState } from "react";
import { ReconciledRecord, ReconciliationMetrics } from "../types";
import {
  Gauge,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from "lucide-react";

interface PerformanceTabProps {
  metrics: ReconciliationMetrics;
  records: ReconciledRecord[];
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  metrics,
  records,
}) => {
  const [filterType, setFilterType] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");

  const recordsWithGroundTruth = records.filter((r) => !!r.ground_truth);
  const filteredRecords = recordsWithGroundTruth.filter((r) => {
    if (filterType === "CORRECT") return r.is_correct_prediction;
    if (filterType === "INCORRECT") return !r.is_correct_prediction;
    return true;
  });

  const correctPredictionsCount = recordsWithGroundTruth.filter(
    (r) => r.is_correct_prediction
  ).length;
  const incorrectPredictionsCount =
    recordsWithGroundTruth.length - correctPredictionsCount;

  return (
    <div className="space-y-6">
      {/* Performance & Rigor Banner */}
      <div className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Reconciliation Accuracy & Mathematical Benchmarking
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Empirical verification of deterministic reconciliation engine against pre-seeded ground truth scenarios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Accuracy: {metrics.accuracy.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 6 Key Benchmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Evaluated Records</span>
            <div className="text-xl font-bold font-mono text-white">
              {recordsWithGroundTruth.length}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Known Ground Truth</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Reconciliation Accuracy</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {metrics.accuracy.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">(TP + TN) / Total</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Precision</span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {metrics.precision.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">TP / (TP + FP)</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Recall</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {metrics.recall.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">TP / (TP + FN)</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Processing Time</span>
            <div className="text-xl font-bold font-mono text-white">
              {metrics.processingTimeMs.toFixed(1)} ms
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Measured execution</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Throughput</span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {metrics.throughput.toFixed(0)} r/s
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Records per second</span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Breakdown */}
      <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-1">Financial Reconciliation Confusion Matrix</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Formal classification distribution between engine prediction and ground truth status
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* TP */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span>True Positive (TP)</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.truePositives}</div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Actual Match correctly predicted as Match
            </p>
          </div>

          {/* TN */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span>True Negative (TN)</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.trueNegatives}</div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Actual Exception correctly caught as Exception
            </p>
          </div>

          {/* FP */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-yellow-500/20">
            <div className="flex items-center justify-between text-xs text-yellow-400 mb-1">
              <span>False Positive (FP)</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.falsePositives}</div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Exception incorrectly marked as Clean Match (Leak)
            </p>
          </div>

          {/* FN */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-red-500/20">
            <div className="flex items-center justify-between text-xs text-red-400 mb-1">
              <span>False Negative (FN)</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.falseNegatives}</div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Clean Match falsely flagged as Exception (False Alarm)
            </p>
          </div>
        </div>
      </div>

      {/* Ground Truth Validation Table */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Ground Truth Verification Audit Log</h3>
            <p className="text-xs text-zinc-400">Record-by-record verification audit</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                filterType === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              All ({recordsWithGroundTruth.length})
            </button>
            <button
              onClick={() => setFilterType("CORRECT")}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                filterType === "CORRECT"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Correct ({correctPredictionsCount})
            </button>
            <button
              onClick={() => setFilterType("INCORRECT")}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                filterType === "INCORRECT"
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Incorrect ({incorrectPredictionsCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Ground Truth Scenario</th>
                <th className="py-3 px-3">Predicted Status</th>
                <th className="py-3 px-3">Match Level</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredRecords.slice(0, 20).map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">
                    {r.transaction_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    ₹{r.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    <div>{r.ground_truth?.expectedScenario}</div>
                    <span className="text-[10px] text-zinc-500 block truncate max-w-xs">{r.ground_truth?.notes}</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {r.match_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                    {r.match_level.replace(/_/g, " ")}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {r.confidence}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {r.is_correct_prediction ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACCURATE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> DISCREPANCY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
