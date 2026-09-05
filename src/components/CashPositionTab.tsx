import React, { useState } from "react";
import { CashPositionMetrics, ReconciledRecord } from "../types";
import {
  Wallet,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Coins,
  ShieldAlert,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface CashPositionTabProps {
  cashPosition: CashPositionMetrics;
  records: ReconciledRecord[];
}

export const CashPositionTab: React.FC<CashPositionTabProps> = ({
  cashPosition,
  records,
}) => {
  const [delayDays, setDelayDays] = useState<number>(7);
  const [costOfCapitalPercent, setCostOfCapitalPercent] = useState<number>(12); // 12% annual cost of capital

  // Simulated scenario calculations
  const unresolvedExposure = cashPosition.unresolvedAmounts;
  // Working capital drag = Exposure * (Cost of Capital / 365) * delayDays
  const workingCapitalInterestCost = Math.round(
    unresolvedExposure * ((costOfCapitalPercent / 100) / 365) * delayDays
  );

  const adjustedNetPosition = Math.max(
    0,
    cashPosition.estimatedNetPosition - workingCapitalInterestCost
  );

  // Waterfall chart data
  const waterfallData = [
    { name: "Gross GMV", value: cashPosition.grossTransactionValue, fill: "#6366f1" },
    { name: "Fees", value: -cashPosition.totalFees, fill: "#8b5cf6" },
    { name: "Tax (GST)", value: -cashPosition.totalTaxes, fill: "#06b6d4" },
    { name: "Exceptions", value: -cashPosition.unresolvedAmounts, fill: "#f59e0b" },
    { name: "Estimated Net", value: cashPosition.estimatedNetPosition, fill: "#10b981" },
  ];

  // Settlement pipeline grouped by expected arrival
  const today = new Date();
  const settlementBuckets = [
    {
      window: "Cleared Today (T+0)",
      amount: Math.round(cashPosition.expectedSettlementValue * 0.65),
      status: "In Bank Account",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      window: "Clearing Tomorrow (T+1)",
      amount: Math.round(cashPosition.expectedSettlementValue * 0.25),
      status: "In Gateway Transit",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    {
      window: "Clearing Next Week (T+2 to T+5)",
      amount: Math.round(cashPosition.expectedSettlementValue * 0.10),
      status: "Scheduled Batch",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      window: "Blocked by Exceptions",
      amount: Math.round(cashPosition.unresolvedAmounts),
      status: "Escalated for Tie-out",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Signature Cash Position Impact banner */}
      <div className="p-4 bg-[#3395FF]/10 border border-[#3395FF]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            Cash Position Impact & Working Capital
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            Estimated net available cash after adjusting for unsettled exceptions, statutory taxes, and gateway fees.
          </div>
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-2xl font-bold font-mono text-[#fafafa]">
            ₹{cashPosition.estimatedNetPosition.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-zinc-500 font-mono">Net Realized</span>
        </div>
      </div>

      {/* Primary Position Summary Card */}
      <div className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Cash Position & Settlement Working Capital
              </h2>
              <p className="text-xs text-zinc-400">
                Formula: Gross GMV − Gateway Fees − Tax − Unresolved Exceptions = Estimated Net Position
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
              Estimated Net Cash Position
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              ₹{cashPosition.estimatedNetPosition.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* 4 Key Pillar Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-1">Gross GMV Recorded</span>
            <div className="text-xl font-bold font-mono text-white">
              ₹{cashPosition.grossTransactionValue.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Full transaction volume</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-1">Total Gateway Deductions</span>
            <div className="text-xl font-bold font-mono text-zinc-200">
              ₹{(cashPosition.totalFees + cashPosition.totalTaxes).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">MDR + 18% GST</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-1">Blocked Exception Float</span>
            <div className="text-xl font-bold font-mono text-red-400">
              ₹{cashPosition.unresolvedAmounts.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Held up in discrepancies</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-1">Net Clearing Realization</span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {((cashPosition.estimatedNetPosition / cashPosition.grossTransactionValue) * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Net liquidity conversion</span>
          </div>
        </div>
      </div>

      {/* Waterfall & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1">Liquidity Waterfall</h3>
          <p className="text-xs text-zinc-400 mb-4">Step-down reconciliation bridge to net cash</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`₹${Math.abs(Number(val)).toLocaleString("en-IN")}`, ""]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Settlement Pipeline */}
        <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Settlement Timeline</h3>
            <p className="text-xs text-zinc-400 mb-4">Projected clearing schedule into corporate bank accounts</p>
            <div className="space-y-3">
              {settlementBuckets.map((bucket, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-850/50 border border-zinc-800/80">
                  <div>
                    <span className="text-xs font-semibold text-white block">{bucket.window}</span>
                    <span className="text-[10px] text-zinc-400">{bucket.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white">
                      ₹{bucket.amount.toLocaleString("en-IN")}
                    </span>
                    <span className={`block text-[10px] px-1.5 py-0.5 rounded border mt-0.5 ${bucket.badge}`}>
                      {bucket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Pending SLA Clearing Window:</span>
            <span className="text-white font-mono font-bold">T+2 Standard Working SLA</span>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Analysis */}
      <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Interactive Scenario: Working Capital Stress Test
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Controller What-If Simulator
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-5">
          Evaluate the financial carrying cost and treasury drag if unresolved exception settlements are delayed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Slider 1: Delay Days */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Settlement Delay:</span>
              <strong className="text-blue-400 font-mono">{delayDays} Days</strong>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-zinc-500">1 to 30 days settlement dispute resolution</span>
          </div>

          {/* Slider 2: Cost of Capital */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Annual Cost of Capital:</span>
              <strong className="text-blue-400 font-mono">{costOfCapitalPercent}%</strong>
            </div>
            <input
              type="range"
              min="6"
              max="20"
              value={costOfCapitalPercent}
              onChange={(e) => setCostOfCapitalPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-zinc-500">Working capital credit facility rate</span>
          </div>

          {/* Result Card */}
          <div className="bg-black/40 p-4 rounded-lg border border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Exception Exposure:</span>
              <span className="font-mono text-yellow-400">₹{unresolvedExposure.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Carrying Interest Drag:</span>
              <span className="font-mono text-red-400 font-bold">−₹{workingCapitalInterestCost.toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white">
              <span>Adjusted Net Liquidity:</span>
              <span className="font-mono text-emerald-400">₹{adjustedNetPosition.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
