import React from "react";
import {
  Play,
  UploadCloud,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  recordCount: number;
  onSelectRecordCount: (count: number) => void;
  onRunDemo: () => void;
  onOpenUpload: () => void;
  onOpenHowItWorks: () => void;
  isRunningDemo: boolean;
  geminiConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  recordCount,
  onSelectRecordCount,
  onRunDemo,
  onOpenUpload,
  onOpenHowItWorks,
  isRunningDemo,
  geminiConfigured,
}) => {
  return (
    <header className="border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-sm sticky top-0 z-40">
      {/* Top Banner: Hackathon Track & Safe Analysis Guarantee */}
      <div className="bg-[#09090b] border-b border-[#27272a] px-4 py-1.5 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Razorpay AI Buildathon · Track 04
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="font-medium text-zinc-300">AI Finance Controller</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
            SYNTHETIC DEMO DATA
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ANALYSIS ONLY · Zero Fund Execution
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-[0_0_12px_rgba(37,99,235,0.3)]">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[#fafafa] flex items-center gap-2">
                FIRA
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800">
                v2.4.0-STABLE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 tracking-normal">
              Financial Intelligence, Reconciliation & Analytics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Record batch selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-[#27272a] text-xs">
            <span className="px-2 py-1 text-zinc-500 font-medium hidden md:inline text-[11px]">
              Batch:
            </span>
            {[50, 100, 250, 500].map((count) => (
              <button
                key={count}
                id={`btn-select-batch-${count}`}
                onClick={() => onSelectRecordCount(count)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  recordCount === count
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {count}
              </button>
            ))}
          </div>

          {/* Run Demo CTA */}
          <button
            id="btn-run-demo"
            onClick={onRunDemo}
            disabled={isRunningDemo}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isRunningDemo ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isRunningDemo ? "RECONCILING..." : "RUN DEMO"}</span>
          </button>

          {/* Upload Data CTA */}
          <button
            id="btn-upload-data"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#27272a] rounded-md text-xs font-medium hover:bg-zinc-900 transition-colors text-zinc-300 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          {/* How It Works Modal CTA */}
          <button
            id="btn-how-it-works"
            onClick={onOpenHowItWorks}
            title="How FIRA Works: Trust & Transparency"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] transition cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
