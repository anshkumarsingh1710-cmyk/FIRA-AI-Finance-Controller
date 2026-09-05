import React, { useState, useMemo } from "react";
import { MatchStatus, ReconciledRecord, SeverityLevel } from "../types";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { exportReconciliationToCSV } from "../services/reportService";

interface ReconciliationTabProps {
  records: ReconciledRecord[];
  onSelectRecord: (record: ReconciledRecord) => void;
}

export const ReconciliationTab: React.FC<ReconciliationTabProps> = ({
  records,
  onSelectRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"date" | "amount" | "confidence" | "difference_amount">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.rule_failed && r.rule_failed.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" || r.match_status === statusFilter;

      const matchesSeverity =
        severityFilter === "ALL" || r.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [records, searchTerm, statusFilter, severityFilter]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderBadge = (status: MatchStatus) => {
    switch (status) {
      case "MATCHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ MATCHED
          </span>
        );
      case "PARTIALLY_MATCHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            ⚠ PARTIAL
          </span>
        );
      case "MISMATCHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            ✕ MISMATCH
          </span>
        );
      case "MISSING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            ! MISSING
          </span>
        );
      case "DUPLICATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            ⚠ DUPLICATE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            ? UNRESOLVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              id="input-recon-search"
              type="text"
              placeholder="Search Transaction ID, Reference, Merchant..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Status Filter */}
          <select
            id="select-recon-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Match Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="PARTIALLY_MATCHED">Partially Matched</option>
            <option value="MISMATCHED">Mismatched</option>
            <option value="MISSING">Missing</option>
            <option value="DUPLICATE">Duplicate</option>
          </select>

          {/* Severity Filter */}
          <select
            id="select-recon-severity"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReconciliationToCSV(records)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Transaction ID</th>
                <th
                  onClick={() => toggleSort("date")}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("amount")}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Source A (Ledger)</th>
                <th className="py-3 px-3">Source B (Gateway)</th>
                <th className="py-3 px-3">Match Status</th>
                <th
                  onClick={() => toggleSort("difference_amount")}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Difference</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("confidence")}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Exception Type</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <div>{r.transaction_id}</div>
                      <span className="text-[10px] text-zinc-500 font-normal">{r.reference_id}</span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                      {r.date ? r.date.substring(5, 16) : "N/A"}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      ₹{r.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-300">
                      ₹{r.source_a?.amount?.toLocaleString("en-IN") || "0"}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {r.source_b ? (
                        `₹${r.source_b.amount?.toLocaleString("en-IN")}`
                      ) : (
                        <span className="text-red-400 font-semibold text-[11px]">MISSING</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderBadge(r.match_status)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {r.difference_amount > 0 ? (
                        <span className="text-yellow-400 font-bold">
                          ₹{r.difference_amount.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              r.confidence > 90
                                ? "bg-emerald-500"
                                : r.confidence > 75
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                            }`}
                            style={{ width: `${r.confidence}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        {r.exception_type === "NONE" ? "None" : r.exception_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        id={`btn-view-txn-${r.transaction_id}`}
                        onClick={() => onSelectRecord(r)}
                        className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500">
                    No transactions matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-white">{Math.min(currentPage * pageSize, sortedRecords.length)}</strong> of{" "}
            <strong className="text-white">{sortedRecords.length}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
