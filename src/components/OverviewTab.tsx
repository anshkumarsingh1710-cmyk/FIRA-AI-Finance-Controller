import React, { useState } from "react";
import {
  CashPositionMetrics,
  FinancialAnalyticsSummary,
  ReconciledRecord,
  ReconciliationMetrics,
} from "../types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock,
  Coins,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface OverviewTabProps {
  metrics: ReconciliationMetrics;
  analytics: FinancialAnalyticsSummary;
  cashPosition: CashPositionMetrics;
  records: ReconciledRecord[];
  onSelectRecord: (record: ReconciledRecord) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  analytics,
  cashPosition,
  records,
  onSelectRecord,
  onNavigateToTab,
}) => {
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);

  const exceptions = records.filter((r) => r.match_status !== "MATCHED");
  const topExceptions = exceptions.slice(0, 5);

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryNotice(null);
    try {
      const response = await fetch("/api/gemini/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics,
          exceptionBreakdown: analytics.exceptionDistribution,
          topExceptions: topExceptions.map((t) => ({
            id: t.transaction_id,
            amount: t.amount,
            diff: t.difference_amount,
            type: t.exception_type,
            rule: t.rule_failed,
          })),
          cashPosition,
        }),
      });
      const data = await response.json();
      if (data.success && data.summary) {
        setExecutiveSummary(data.summary);
        if (data.notice) {
          setSummaryNotice(data.notice);
        }
      }
    } catch (err) {
      console.error("AI Summary generation failed:", err);
      setExecutiveSummary(
        `FIRA processed ${metrics.totalRecords} transactions and reconciled ${metrics.matchedRecords} (${metrics.matchRate.toFixed(1)}% match rate) with ${metrics.accuracy.toFixed(1)}% verified accuracy. ₹${metrics.totalExceptionValue.toLocaleString("en-IN")} remains at risk across ${metrics.totalExceptions} exceptions. Recommend immediate focus on amount mismatches and uncaptured settlement records.`
      );
      setSummaryNotice("AI explanation unavailable. Deterministic reconciliation results remain available.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Funnel & Pie chart data
  const pieData = [
    { name: "Matched", value: metrics.matchedRecords, color: "#10b981" },
    { name: "Partial Matches", value: metrics.partialMatchRate > 0 ? Math.round((metrics.partialMatchRate / 100) * metrics.totalRecords) : 0, color: "#06b6d4" },
    { name: "Mismatches", value: metrics.mismatchedRecords, color: "#f59e0b" },
    { name: "Missing", value: metrics.missingRecords, color: "#ef4444" },
    { name: "Duplicates", value: metrics.duplicateRecords, color: "#ec4899" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Records */}
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total Records</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#fafafa]">
            {metrics.totalRecords}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-zinc-400">
            <span>Value: <strong className="text-zinc-200">₹{(analytics.totalTransactionValue / 100000).toFixed(2)}L</strong></span>
            <span className="text-[11px] font-mono text-blue-400">{metrics.processingTimeMs.toFixed(1)}ms</span>
          </div>
        </div>

        {/* Card 2: Match Rate */}
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Match Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.matchRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-zinc-400">
            <span>Exact: <strong className="text-zinc-200">{metrics.exactMatchRate.toFixed(1)}%</strong></span>
            <span>Partial: <strong className="text-zinc-200">{metrics.partialMatchRate.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Card 3: Measured Accuracy */}
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Accuracy (GT)</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {metrics.accuracy.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-zinc-400">
            <span>Prec: <strong className="text-zinc-200">{metrics.precision.toFixed(1)}%</strong></span>
            <span>Recall: <strong className="text-zinc-200">{metrics.recall.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Card 4: Value at Risk */}
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Value at Risk</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            ₹{metrics.totalExceptionValue.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-zinc-400">
            <span>{metrics.totalExceptions} Exceptions</span>
            <span className="text-red-400 font-semibold">{metrics.exceptionRate.toFixed(1)}% rate</span>
          </div>
        </div>
      </div>

      {/* AI Executive Summary Briefing */}
      <div className="bg-[#0a0f1a] rounded-xl p-5 border border-blue-900/30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Controller Executive Insights
              </h3>
              <p className="text-xs text-zinc-400">
                Synthesis powered by Gemini · Strictly grounded in verified calculations
              </p>
            </div>
          </div>

          <button
            id="btn-generate-ai-summary"
            onClick={handleGenerateAISummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingSummary ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{executiveSummary ? "Regenerate Brief" : "Generate AI Brief"}</span>
          </button>
        </div>

        {summaryNotice && (
          <div className="text-[11px] mb-3 px-3 py-1 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300">
            {summaryNotice}
          </div>
        )}

        <div className="bg-black/40 rounded-lg p-4 border border-zinc-850 text-xs text-zinc-300 leading-relaxed font-normal">
          {executiveSummary ? (
            <div className="whitespace-pre-line space-y-2">
              {executiveSummary}
            </div>
          ) : (
            <p className="text-zinc-400 italic">
              FIRA processed {metrics.totalRecords} transactions and reconciled {metrics.matchedRecords} ({metrics.matchRate.toFixed(1)}% match rate). Click <strong>"Generate AI Brief"</strong> to have Gemini analyze cross-source exception patterns, root causes, and financial exposure directives for the CFO.
            </p>
          )}
        </div>
      </div>

      {/* Reconciliation Funnel Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel breakdown card */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Reconciliation Operations Flow</h3>
              <p className="text-xs text-zinc-400">Audit pipeline from ingestion to settlement tie-out</p>
            </div>
            <button
              onClick={() => onNavigateToTab("reconciliation")}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              View Full Table <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Step 1: Ingested */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/60">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold font-mono">1</span>
                <div>
                  <span className="text-xs font-semibold text-white block">Total Records Ingested</span>
                  <span className="text-[11px] text-zinc-400">Source A (Ledger) + Source B (Gateway)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-white">{metrics.totalRecords}</span>
                <span className="text-[10px] text-zinc-500 block">100% Ingestion Parity</span>
              </div>
            </div>

            {/* Step 2: Matched */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">2</span>
                <div>
                  <span className="text-xs font-semibold text-emerald-300 block">Verified Matched Records</span>
                  <span className="text-[11px] text-zinc-400">Level 1 - 4 Deterministic Match</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-emerald-400">{metrics.matchedRecords}</span>
                <span className="text-[10px] text-emerald-400/80 block">{metrics.matchRate.toFixed(1)}% Match Rate</span>
              </div>
            </div>

            {/* Step 3: Partial Matches */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/20 border border-blue-900/30">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center text-xs font-bold font-mono">3</span>
                <div>
                  <span className="text-xs font-semibold text-blue-300 block">Partial Matches / SLA Flags</span>
                  <span className="text-[11px] text-zinc-400">Delayed settlements or reference variances</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-blue-400">
                  {Math.round((metrics.partialMatchRate / 100) * metrics.totalRecords)}
                </span>
                <span className="text-[10px] text-blue-400/80 block">{metrics.partialMatchRate.toFixed(1)}% Partial Rate</span>
              </div>
            </div>

            {/* Step 4: Exceptions */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-950/20 border border-yellow-900/30">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-900/60 text-yellow-300 flex items-center justify-center text-xs font-bold font-mono">4</span>
                <div>
                  <span className="text-xs font-semibold text-yellow-300 block">Identified Exceptions</span>
                  <span className="text-[11px] text-zinc-400">Amount, Missing, Fee, or Status conflicts</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-yellow-400">{metrics.totalExceptions}</span>
                <span className="text-[10px] text-yellow-400/80 block">₹{metrics.totalExceptionValue.toLocaleString("en-IN")} at risk</span>
              </div>
            </div>

            {/* Step 5: Unresolved */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-950/20 border border-red-900/30">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-900/60 text-red-300 flex items-center justify-center text-xs font-bold font-mono">5</span>
                <div>
                  <span className="text-xs font-semibold text-red-300 block">Unresolved Requiring Action</span>
                  <span className="text-[11px] text-zinc-400">Pending finance team investigation</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-red-400">{metrics.unresolvedRecords || metrics.totalExceptions}</span>
                <span className="text-[10px] text-red-400/80 block">Action required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Breakdown Chart */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white mb-1">Status Distribution</h3>
          <p className="text-xs text-zinc-400 mb-4">Proportion of batch outcome</p>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-1.5 text-xs">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span>{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Priority Exceptions Table */}
      <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">High-Priority Exceptions Requiring Investigation</h3>
            <p className="text-xs text-zinc-400">Top flagged transactions by financial exposure</p>
          </div>
          <button
            onClick={() => onNavigateToTab("exceptions")}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            Open All Exceptions ({exceptions.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Merchant / Party</th>
                <th className="py-2.5 px-3">Ledger Amount</th>
                <th className="py-2.5 px-3">Settlement Amount</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Exception Type</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {topExceptions.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-semibold text-white">
                    {r.transaction_id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-zinc-300">
                    {r.customer_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    ₹{r.source_a?.amount?.toLocaleString("en-IN") || "0"}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {r.source_b ? `₹${r.source_b.amount?.toLocaleString("en-IN")}` : <span className="text-red-400">MISSING</span>}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-yellow-400">
                    {r.difference_amount > 0 ? `₹${r.difference_amount.toLocaleString("en-IN")}` : "Timing Lag"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                      {r.exception_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      id={`btn-inspect-overview-${r.transaction_id}`}
                      onClick={() => onSelectRecord(r)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
                    >
                      Inspect & AI
                    </button>
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
