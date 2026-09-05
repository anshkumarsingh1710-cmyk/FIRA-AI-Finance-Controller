import React, { useState } from "react";
import {
  AnomalyItem,
  FinancialAnalyticsSummary,
  ReconciledRecord,
} from "../types";
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Percent,
  Coins,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { detectStatisticalAnomalies } from "../services/anomalyService";

interface FinancialAnalyticsTabProps {
  analytics: FinancialAnalyticsSummary;
  records: ReconciledRecord[];
}

export const FinancialAnalyticsTab: React.FC<FinancialAnalyticsTabProps> = ({
  analytics,
  records,
}) => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>(() =>
    detectStatisticalAnomalies(records)
  );
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const handleExplainAnomaly = async (anom: AnomalyItem) => {
    setSelectedAnomaly(anom);
    setIsExplaining(true);
    setAiExplanation(null);
    try {
      const response = await fetch("/api/gemini/explain-anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomaly: anom,
          datasetStats: {
            sampleSize: records.length,
            avgAmount: analytics.avgTransactionValue,
          },
        }),
      });
      const data = await response.json();
      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error("Anomaly explanation error:", err);
      setAiExplanation(
        `Controller Assessment: Observed value of ${anom.value} deviates significantly from baseline expectations (${anom.threshold}). This poses operational and cash float risks that require manual transaction log review.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Gross GMV</span>
          <div className="text-lg font-bold font-mono text-white truncate">
            ₹{analytics.totalTransactionValue.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">Internal Ledger</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Settled Gross</span>
          <div className="text-lg font-bold font-mono text-emerald-400 truncate">
            ₹{analytics.totalSettledValue.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">Gateway Captured</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Total Gateway Fees</span>
          <div className="text-lg font-bold font-mono text-purple-400 truncate">
            ₹{analytics.totalFees.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">Processing MDR</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Total GST / Tax</span>
          <div className="text-lg font-bold font-mono text-blue-400 truncate">
            ₹{analytics.totalTax.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">18% on Fees</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Average Ticket</span>
          <div className="text-lg font-bold font-mono text-white truncate">
            ₹{analytics.avgTransactionValue.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">Per Transaction</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Largest Transaction</span>
          <div className="text-lg font-bold font-mono text-yellow-400 truncate">
            ₹{analytics.largestTransaction.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-500">Single Peak Value</span>
        </div>
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume & Value Timeline */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Reconciliation Volume & Value Over Time</h3>
              <p className="text-xs text-zinc-400">Daily settlement timeline with matched vs exception split</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.volumeOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fafafa",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                />
                <Legend />
                <Bar dataKey="matchedValue" name="Matched Value (₹)" fill="#10b981" stackId="a" />
                <Bar dataKey="exceptionValue" name="Exception Value (₹)" fill="#eab308" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Exception Categories Breakdown */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Exception Categories by Value</h3>
              <p className="text-xs text-zinc-400">Financial exposure grouped by deterministic exception rule</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.exceptionDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis dataKey="type" type="category" stroke="#71717a" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fafafa",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Exposure"]}
                />
                <Bar dataKey="value" name="Exposure (₹)" fill="#eab308" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Payment Method & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1">Payment Method Distribution</h3>
          <p className="text-xs text-zinc-400 mb-4">Breakdown across UPI, Cards, Net Banking & Wallets</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.paymentMethodDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis dataKey="method" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fafafa",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Value"]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1">Order Execution Status Summary</h3>
          <p className="text-xs text-zinc-400 mb-4">Volume counts by authorization state</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <span className="text-xs text-emerald-400 font-semibold block">SUCCESS</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{analytics.successfulCount}</div>
              <span className="text-[10px] text-zinc-500">Captured and cleared</span>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <span className="text-xs text-red-400 font-semibold block">FAILED</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{analytics.failedCount}</div>
              <span className="text-[10px] text-zinc-500">Payment rejected/dropped</span>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <span className="text-xs text-yellow-400 font-semibold block">PENDING</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{analytics.pendingCount}</div>
              <span className="text-[10px] text-zinc-500">In settlement clearing window</span>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <span className="text-xs text-blue-400 font-semibold block">EXCEPTIONS</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{analytics.exceptionCount}</div>
              <span className="text-[10px] text-zinc-500">Reconciliation variances</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTICAL ANOMALY DETECTION SECTION */}
      <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-bold text-white">
                Statistical Anomaly Detection Engine
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                IQR & Z-Score Analysis
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Deterministic outlier identification across transaction values, fee ratios, and settlement SLA delays
            </p>
          </div>
        </div>

        {/* Anomaly list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="bg-zinc-900/60 hover:bg-zinc-800/40 rounded-xl p-4 border border-zinc-800 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{anom.transaction_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(anom.severity)}`}>
                      {anom.severity}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 block mt-1">{anom.metric}</span>
                </div>

                <button
                  id={`btn-explain-anom-${anom.transaction_id}`}
                  onClick={() => handleExplainAnomaly(anom)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Explain with AI</span>
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                {anom.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-800 text-zinc-400">
                <div>Observed: <strong className="text-white font-mono">{anom.value}</strong></div>
                <div>Baseline: <strong className="text-zinc-300">{anom.threshold}</strong></div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Anomaly Reasoning Modal / Drawer */}
        {selectedAnomaly && (
          <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Controller Assessment: {selectedAnomaly.transaction_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>

            {isExplaining ? (
              <div className="flex items-center gap-2 text-xs text-blue-400 py-3">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating controller risk evaluation with Gemini...</span>
              </div>
            ) : (
              <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                {aiExplanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
