import React, { useState, useRef } from "react";
import { FinancialRecord } from "../types";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Database,
  CreditCard,
  Sparkles,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import {
  downloadSampleSourceA,
  downloadSampleSourceB,
  exportSampleCSVTemplates,
  getSampleSourceACSV,
  getSampleSourceBCSV,
} from "../services/reportService";
import {
  parseCSVToFinancialRecords,
  handleSingleFileReconciliation,
} from "../services/csvParser";

interface DataIngestionTabProps {
  onLoadCustomDataset: (sourceA: FinancialRecord[], sourceB: FinancialRecord[]) => void;
  onRunDemo: () => void;
  isRunningDemo: boolean;
  totalIngestedCount: number;
}

export const DataIngestionTab: React.FC<DataIngestionTabProps> = ({
  onLoadCustomDataset,
  onRunDemo,
  isRunningDemo,
  totalIngestedCount,
}) => {
  const [sourceAFile, setSourceAFile] = useState<File | null>(null);
  const [sourceBFile, setSourceBFile] = useState<File | null>(null);
  const [parsedSourceA, setParsedSourceA] = useState<FinancialRecord[] | null>(null);
  const [parsedSourceB, setParsedSourceB] = useState<FinancialRecord[] | null>(null);

  const [isDraggingA, setIsDraggingA] = useState<boolean>(false);
  const [isDraggingB, setIsDraggingB] = useState<boolean>(false);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // File parsing handler for Source A
  const handleFileAChange = async (file: File | null) => {
    setParseError(null);
    setUploadStatus(null);
    setSourceAFile(file);
    if (!file) {
      setParsedSourceA(null);
      return;
    }

    try {
      const text = await file.text();
      const records = parseCSVToFinancialRecords(text, "A");
      if (records.length === 0) {
        setParseError(`Could not find valid financial rows in "${file.name}". Please check columns.`);
        setParsedSourceA(null);
      } else {
        setParsedSourceA(records);
      }
    } catch (err: any) {
      setParseError(`Error reading "${file.name}": ${err.message}`);
      setParsedSourceA(null);
    }
  };

  // File parsing handler for Source B
  const handleFileBChange = async (file: File | null) => {
    setParseError(null);
    setUploadStatus(null);
    setSourceBFile(file);
    if (!file) {
      setParsedSourceB(null);
      return;
    }

    try {
      const text = await file.text();
      const records = parseCSVToFinancialRecords(text, "B");
      if (records.length === 0) {
        setParseError(`Could not find valid financial rows in "${file.name}". Please check columns.`);
        setParsedSourceB(null);
      } else {
        setParsedSourceB(records);
      }
    } catch (err: any) {
      setParseError(`Error reading "${file.name}": ${err.message}`);
      setParsedSourceB(null);
    }
  };

  // Drag and Drop handlers for Source A
  const handleDropA = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileAChange(e.dataTransfer.files[0]);
    }
  };

  // Drag and Drop handlers for Source B
  const handleDropB = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileBChange(e.dataTransfer.files[0]);
    }
  };

  // 1-Click Load Sample Pair directly
  const handleLoadSampleDataDirectly = () => {
    setParseError(null);
    setIsProcessing(true);
    try {
      const sampleA = parseCSVToFinancialRecords(getSampleSourceACSV(), "A");
      const sampleB = parseCSVToFinancialRecords(getSampleSourceBCSV(), "B");
      setParsedSourceA(sampleA);
      setParsedSourceB(sampleB);
      setSourceAFile(new File([getSampleSourceACSV()], "Sample_ERP_Ledger.csv", { type: "text/csv" }));
      setSourceBFile(new File([getSampleSourceBCSV()], "Sample_Gateway_Settlement.csv", { type: "text/csv" }));
      setUploadStatus(`Loaded ${sampleA.length} Source A and ${sampleB.length} Source B sample records.`);
      onLoadCustomDataset(sampleA, sampleB);
    } catch (err: any) {
      setParseError(`Failed to load sample templates: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute reconciliation on uploaded data
  const handleProcessUploadedFiles = async () => {
    setParseError(null);
    setIsProcessing(true);

    try {
      // Case 1: Both Source A and Source B provided
      if (parsedSourceA && parsedSourceA.length > 0 && parsedSourceB && parsedSourceB.length > 0) {
        setUploadStatus(
          `Reconciling ${parsedSourceA.length} Source A records against ${parsedSourceB.length} Source B records...`
        );
        onLoadCustomDataset(parsedSourceA, parsedSourceB);
        return;
      }

      // Case 2: Only Source A provided (Single-file mode)
      if (sourceAFile && (!parsedSourceB || parsedSourceB.length === 0)) {
        const text = await sourceAFile.text();
        const singleResult = handleSingleFileReconciliation(text);

        if (singleResult.sourceA.length === 0) {
          setParseError("Could not extract valid records from uploaded file.");
          setIsProcessing(false);
          return;
        }

        setUploadStatus(
          `Single ledger processed: ${singleResult.sourceA.length} records ingested with counterpart gateway settlement matching.`
        );
        onLoadCustomDataset(singleResult.sourceA, singleResult.sourceB);
        return;
      }

      // Case 3: Only Source B provided
      if (sourceBFile && (!parsedSourceA || parsedSourceA.length === 0)) {
        const text = await sourceBFile.text();
        const singleResult = handleSingleFileReconciliation(text);
        setUploadStatus(
          `Gateway settlement file processed: ${singleResult.sourceA.length} records ingested.`
        );
        onLoadCustomDataset(singleResult.sourceA, singleResult.sourceB);
        return;
      }

      setParseError("Please select at least one CSV file to reconcile.");
    } catch (err: any) {
      setParseError(`Processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasAnyFile = (parsedSourceA && parsedSourceA.length > 0) || (parsedSourceB && parsedSourceB.length > 0) || sourceAFile || sourceBFile;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Instant Demo */}
        <div className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <h3 className="text-base font-bold text-white">
                Option 1: One-Click Demo Engine
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Instantly generate realistic multi-source financial datasets with pre-seeded ground truth scenarios:
              exact matches, partial matches, delayed settlements, fee variations, missing records, status mismatches, and duplicates.
            </p>

            <ul className="text-xs text-zinc-400 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Source A: Internal Ledger (100–500 ERP Records)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Source B: Payment Gateway Settlement (Razorpay/Stripe format)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Source C: Bank Clearing Statements</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Embedded Ground Truth for Precision & Recall evaluation</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onRunDemo}
            disabled={isRunningDemo}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isRunningDemo ? "Reconciling Live Pipeline..." : "Generate & Run Demo Dataset"}
          </button>
        </div>

        {/* Method 2: CSV Upload */}
        <div className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Option 2: Custom Multi-Source Upload
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Supports Dual-Source (Ledger + Gateway) or Single CSV
                  </span>
                </div>
              </div>

              {/* Sample Download Menu */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLoadSampleDataDirectly}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[11px] font-medium border border-blue-500/20 transition cursor-pointer"
                  title="Directly load sample CSV data without manual file selection"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Load Sample</span>
                </button>
                <button
                  onClick={exportSampleCSVTemplates}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 transition cursor-pointer"
                  title="Download both Source A and Source B sample CSV files"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Samples</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Drag & drop or browse your accounting ledger and gateway settlement files. FIRA accepts standard CSV formats with automatic header mapping.
            </p>

            <div className="space-y-3 mb-4">
              {/* File A Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingA(true);
                }}
                onDragLeave={() => setIsDraggingA(false)}
                onDrop={handleDropA}
                className={`p-3 rounded-lg border transition ${
                  isDraggingA
                    ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500"
                    : parsedSourceA
                    ? "bg-zinc-950 border-zinc-700"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Source A: Internal Ledger</span>
                        {parsedSourceA && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                            {parsedSourceA.length} rows loaded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-[220px]">
                        {sourceAFile ? sourceAFile.name : "Drag & drop CSV or click Browse"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={downloadSampleSourceA}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-1"
                      title="Download Source A Sample CSV"
                    >
                      Sample
                    </button>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      ref={fileInputARef}
                      onChange={(e) => handleFileAChange(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputARef.current?.click()}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer"
                    >
                      {sourceAFile ? "Change" : "Browse"}
                    </button>
                  </div>
                </div>
              </div>

              {/* File B Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingB(true);
                }}
                onDragLeave={() => setIsDraggingB(false)}
                onDrop={handleDropB}
                className={`p-3 rounded-lg border transition ${
                  isDraggingB
                    ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500"
                    : parsedSourceB
                    ? "bg-zinc-950 border-zinc-700"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Source B: Gateway Settlement</span>
                        {parsedSourceB && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                            {parsedSourceB.length} rows loaded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-[220px]">
                        {sourceBFile ? sourceBFile.name : "Drag & drop CSV or click Browse (Optional if single file)"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={downloadSampleSourceB}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-1"
                      title="Download Source B Sample CSV"
                    >
                      Sample
                    </button>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      ref={fileInputBRef}
                      onChange={(e) => handleFileBChange(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputBRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer"
                    >
                      {sourceBFile ? "Change" : "Browse"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Success Status */}
            {uploadStatus && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleProcessUploadedFiles}
            disabled={!hasAnyFile || isProcessing}
            className="w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Parsing & Reconciling...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>
                  {parsedSourceA && parsedSourceB
                    ? `Reconcile ${parsedSourceA.length} vs ${parsedSourceB.length} Records`
                    : parsedSourceA
                    ? `Reconcile Source A (${parsedSourceA.length} Records)`
                    : "Reconcile Uploaded CSV Data"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Source Ingestion Architecture schema */}
      <div className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-2">Supported Multi-Source Schema Mapping</h3>
        <p className="text-xs text-zinc-400 mb-4">
          FIRA automatically detects and normalizes primary and secondary identifiers across heterogeneous financial inputs:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-blue-400 block mb-2">Primary Match Keys</span>
            <ul className="space-y-1 text-zinc-300 text-[11px]">
              <li>• `transaction_id`: System of record unique key (or Txn ID, Order ID, Payment ID)</li>
              <li>• `reference_id`: Client/merchant order token (or Ref ID, UTR, Invoice No)</li>
              <li>• `settlement_id`: Gateway batch identifier (or Payout ID, Batch No)</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-purple-400 block mb-2">Financial Parity Fields</span>
            <ul className="space-y-1 text-zinc-300 text-[11px]">
              <li>• `amount`: Transaction gross principal (handles ₹, $, commas, currency symbols)</li>
              <li>• `gateway_fee`: MDR & interchange deduction (auto-calculated if missing)</li>
              <li>• `tax`: Surcharge GST 18% (auto-calculated if missing)</li>
              <li>• `net_amount`: Cash settlement credit</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-teal-400 block mb-2">Lifecycle & Timing</span>
            <ul className="space-y-1 text-zinc-300 text-[11px]">
              <li>• `date`: Authorization timestamp (ISO, UTC, or formatted date)</li>
              <li>• `settlement_date`: Bank clearing timestamp</li>
              <li>• `status`: SUCCESS, FAILED, PENDING, REFUNDED</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
