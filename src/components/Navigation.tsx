import React from "react";
import {
  LayoutDashboard,
  GitCompare,
  AlertTriangle,
  BarChart3,
  Wallet,
  Gauge,
  UploadCloud,
  FileText,
} from "lucide-react";

export type TabKey =
  | "overview"
  | "reconciliation"
  | "exceptions"
  | "analytics"
  | "cash-position"
  | "performance"
  | "data-ingestion"
  | "reports";

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  exceptionCount: number;
  accuracy: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  exceptionCount,
  accuracy,
}) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reconciliation", label: "Reconciliation", icon: GitCompare },
    {
      id: "exceptions",
      label: "Exceptions",
      icon: AlertTriangle,
      badge: exceptionCount > 0 ? exceptionCount : undefined,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    { id: "analytics", label: "Financial Analytics", icon: BarChart3 },
    { id: "cash-position", label: "Cash Position", icon: Wallet },
    {
      id: "performance",
      label: "Performance",
      icon: Gauge,
      badge: `${accuracy.toFixed(0)}%`,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    { id: "data-ingestion", label: "Data Ingestion", icon: UploadCloud },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="border-b border-[#27272a] bg-[#09090b]/80 sticky top-[81px] sm:top-[85px] z-30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => onTabChange(tab.id as TabKey)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-800/50 text-blue-400 border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      tab.badgeColor || "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
