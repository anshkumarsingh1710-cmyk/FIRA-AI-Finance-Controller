import React, { useState, useMemo } from "react";
import { ReconciledRecord, SeverityLevel } from "../types";
import {
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Layers,
} from "lucide-react";

interface ExceptionsTabProps {
  records: ReconciledRecord[];
  onSelectRecord: (record: ReconciledRecord) => void;
  onResolve: (transactionId: string) => void;
}

export const ExceptionsTab: React.FC<ExceptionsTabProps> = ({
  records,
  onSelectRecord,
  onResolve,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const exceptions = useMemo(() => {
    return records.filter((r) => r.match_status !== "MATCHED");
  }, [records]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((r) => {
      const matchSeverity = severityFilter === "ALL" || r.severity === severityFilter;
      const matchType = typeFilter === "ALL" || r.exception_type === typeFilter;
      const matchSearch =
        r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.exception_type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSeverity && matchType && matchSearch;
    });
  }, [exceptions, severityFilter, typeFilter, searchTerm]);

  const highSeverityCount = exceptions.filter(
    (e) => e.severity === "HIGH" || e.severity === "CRITICAL"
  ).length;

  const totalFinancialImpact = exceptions.reduce(
    (acc, curr) => acc + (curr.difference_amount || curr.amount),
    0
  );

  const unresolvedCount = exceptions.filter((e) => !e.resolved).length;

  const getSeverityBadge = (sev: SeverityLevel) => {
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
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Total Exceptions</span>
          <div className="text-2xl font-bold font-mono text-yellow-400">
            {exceptions.length}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">Across all reconciliation rules</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">High & Critical Severity</span>
          <div className="text-2xl font-bold font-mono text-red-400">
            {highSeverityCount}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">Requires senior controller sign-off</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Total Financial Impact</span>
          <div className="text-2xl font-bold font-mono text-[#fafafa]">
            ₹{totalFinancialImpact.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">Aggregate variance at risk</span>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Unresolved Exceptions</span>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {unresolvedCount}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1">Active items pending review</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              id="input-exception-search"
              type="text"
              placeholder="Search exceptions by ID, Merchant or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            id="select-exception-severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            id="select-exception-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Exception Types</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="MISSING_TRANSACTION">Missing Transaction</option>
            <option value="DUPLICATE_TRANSACTION">Duplicate Transaction</option>
            <option value="FEE_MISMATCH">Fee Mismatch</option>
            <option value="DATE_MISMATCH">Date Mismatch</option>
            <option value="STATUS_MISMATCH">Status Mismatch</option>
            <option value="REFERENCE_MISMATCH">Reference Mismatch</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400">
          Showing <strong className="text-white">{filteredExceptions.length}</strong> of {exceptions.length} exceptions
        </div>
      </div>

      {/* Exception Management Table */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Exception Category</th>
                <th className="py-3 px-3">Ledger vs Settlement</th>
                <th className="py-3 px-3">Financial Impact</th>
                <th className="py-3 px-3">Failed Rule</th>
                <th className="py-3 px-3">Resolution State</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredExceptions.length > 0 ? (
                filteredExceptions.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-zinc-800/30 transition cursor-pointer"
                    onClick={() => onSelectRecord(rec)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <div>{rec.transaction_id}</div>
                      <span className="text-[10px] text-zinc-400 font-normal">{rec.customer_name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(rec.severity)}`}>
                        {rec.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-zinc-200 block">
                        {rec.exception_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {rec.difference_type || "Metadata conflict"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div>A: ₹{rec.source_a?.amount?.toLocaleString("en-IN") || "0"}</div>
                      <div className="text-zinc-400">
                        B: {rec.source_b ? `₹${rec.source_b.amount?.toLocaleString("en-IN")}` : <span className="text-red-400">MISSING</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-yellow-400">
                      ₹{(rec.difference_amount || rec.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-400 max-w-[200px] truncate">
                      {rec.rule_failed || "RULE_UNRESOLVED"}
                    </td>
                    <td className="py-3 px-3">
                      {rec.resolved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <span className="text-red-400 text-[11px] font-semibold">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-analyze-exception-${rec.transaction_id}`}
                          onClick={() => onSelectRecord(rec)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Analyze with AI</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No exceptions matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
