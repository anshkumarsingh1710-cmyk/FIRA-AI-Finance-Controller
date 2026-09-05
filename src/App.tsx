import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { Navigation, TabKey } from "./components/Navigation";
import { ControllerScorecard } from "./components/ControllerScorecard";
import { OverviewTab } from "./components/OverviewTab";
import { ReconciliationTab } from "./components/ReconciliationTab";
import { ExceptionsTab } from "./components/ExceptionsTab";
import { FinancialAnalyticsTab } from "./components/FinancialAnalyticsTab";
import { CashPositionTab } from "./components/CashPositionTab";
import { PerformanceTab } from "./components/PerformanceTab";
import { DataIngestionTab } from "./components/DataIngestionTab";
import { ReportsTab } from "./components/ReportsTab";
import { ExceptionDetailDrawer } from "./components/ExceptionDetailDrawer";
import { HowItWorksModal } from "./components/HowItWorksModal";

import { generateSyntheticDataset } from "./services/dataGenerator";
import { runReconciliation } from "./services/reconciliationEngine";
import { computeFinancialAnalytics, computeCashPosition } from "./services/analyticsService";
import { FinancialRecord, ReconciledRecord } from "./types";
import { ShieldCheck } from "lucide-react";

export function App() {
  const [recordCount, setRecordCount] = useState<number>(100);
  const [isRunningDemo, setIsRunningDemo] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedRecord, setSelectedRecord] = useState<ReconciledRecord | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Initialize with synthetic data
  const [dataset, setDataset] = useState(() => generateSyntheticDataset(100));

  const reconciliationResult = useMemo(() => {
    return runReconciliation(
      dataset.sourceA,
      dataset.sourceB,
      dataset.sourceC,
      dataset.groundTruth
    );
  }, [dataset]);

  // Merge resolved state into records
  const recordsWithResolvedState = useMemo(() => {
    return reconciliationResult.records.map((r) => {
      if (resolvedIds.has(r.transaction_id)) {
        return { ...r, resolved: true };
      }
      return r;
    });
  }, [reconciliationResult.records, resolvedIds]);

  const analytics = useMemo(() => {
    return computeFinancialAnalytics(recordsWithResolvedState);
  }, [recordsWithResolvedState]);

  const cashPosition = useMemo(() => {
    return computeCashPosition(recordsWithResolvedState, analytics);
  }, [recordsWithResolvedState, analytics]);

  // Check Gemini health on mount
  useEffect(() => {
    fetch("/api/gemini/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setGeminiConfigured(data.geminiConfigured);
        }
      })
      .catch((err) => console.log("Health check non-blocking:", err));
  }, []);

  const handleRunDemo = useCallback(
    (count = recordCount) => {
      setIsRunningDemo(true);
      setTimeout(() => {
        const newDataset = generateSyntheticDataset(count);
        setDataset(newDataset);
        setResolvedIds(new Set());
        setIsRunningDemo(false);
      }, 150);
    },
    [recordCount]
  );

  const handleSelectRecordCount = (count: number) => {
    setRecordCount(count);
    handleRunDemo(count);
  };

  const handleLoadCustomDataset = (
    sourceA: FinancialRecord[],
    sourceB: FinancialRecord[],
    sourceC: FinancialRecord[] = []
  ) => {
    setDataset({
      sourceA,
      sourceB,
      sourceC,
      groundTruth: new Map(),
    });
    setResolvedIds(new Set());
    setActiveTab("reconciliation");
  };

  const handleResolveException = (transactionId: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.add(transactionId);
      return next;
    });
    if (selectedRecord && selectedRecord.transaction_id === transactionId) {
      setSelectedRecord((prev) => (prev ? { ...prev, resolved: true } : null));
    }
  };

  const exceptionCount = recordsWithResolvedState.filter(
    (r) => r.match_status !== "MATCHED" && !r.resolved
  ).length;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Header */}
      <Header
        recordCount={recordCount}
        onSelectRecordCount={handleSelectRecordCount}
        onRunDemo={() => handleRunDemo(recordCount)}
        onOpenUpload={() => setActiveTab("data-ingestion")}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        isRunningDemo={isRunningDemo}
        geminiConfigured={geminiConfigured}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        exceptionCount={exceptionCount}
        accuracy={reconciliationResult.metrics.accuracy}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Prominent Controller Scorecard (Always visible or primary anchor) */}
        <ControllerScorecard
          metrics={reconciliationResult.metrics}
          resolvedCount={resolvedIds.size}
        />

        {/* Tab Views */}
        {activeTab === "overview" && (
          <OverviewTab
            metrics={reconciliationResult.metrics}
            analytics={analytics}
            cashPosition={cashPosition}
            records={recordsWithResolvedState}
            onSelectRecord={(r) => setSelectedRecord(r)}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "reconciliation" && (
          <ReconciliationTab
            records={recordsWithResolvedState}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />
        )}

        {activeTab === "exceptions" && (
          <ExceptionsTab
            records={recordsWithResolvedState}
            onSelectRecord={(r) => setSelectedRecord(r)}
            onResolve={handleResolveException}
          />
        )}

        {activeTab === "analytics" && (
          <FinancialAnalyticsTab
            analytics={analytics}
            records={recordsWithResolvedState}
          />
        )}

        {activeTab === "cash-position" && (
          <CashPositionTab
            cashPosition={cashPosition}
            records={recordsWithResolvedState}
          />
        )}

        {activeTab === "performance" && (
          <PerformanceTab
            metrics={reconciliationResult.metrics}
            records={recordsWithResolvedState}
          />
        )}

        {activeTab === "data-ingestion" && (
          <DataIngestionTab
            onLoadCustomDataset={handleLoadCustomDataset}
            onRunDemo={() => handleRunDemo(recordCount)}
            isRunningDemo={isRunningDemo}
            totalIngestedCount={dataset.sourceA.length}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            metrics={reconciliationResult.metrics}
            analytics={analytics}
            cashPosition={cashPosition}
            records={recordsWithResolvedState}
          />
        )}
      </main>

      {/* Side Drawer for Exception Inspection & Gemini AI Analyst */}
      <ExceptionDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onResolve={handleResolveException}
      />

      {/* Transparency & Trust Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Global Regulatory & Safety Footer */}
      <footer className="border-t border-[#27272a] bg-[#09090b] py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200">FIRA</span>
            <span className="text-zinc-500">· Financial Intelligence, Reconciliation & Analytics</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ANALYSIS ONLY
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Zero Payment or Fund Execution</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Razorpay AI Buildathon Track 04</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
