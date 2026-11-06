import React from "react";
import { TrackerStatus } from "../types/product";
import {
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Download,
  Sun,
  Moon,
  AlertTriangle
} from "lucide-react";

interface HeaderStatusBarProps {
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const HeaderStatusBar: React.FC<HeaderStatusBarProps> = ({
  status,
  isRefreshing,
  onRefreshAll,
  onOpenImportModal,
  onExportCsv,
  isDarkMode,
  onToggleTheme
}) => {
  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return "Never";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getHealthDotClass = (retailerStatus: string) => {
    if (retailerStatus === "success") return "pulse";
    if (retailerStatus === "blocked_waf" || retailerStatus === "rate_limited") return "waf";
    return "error";
  };

  const hasCvsError = status.cvs.status === "error" || status.cvs.status === "blocked_waf";
  const hasCostcoError = status.costco.status === "error" || status.costco.status === "blocked_waf";
  const anyError = hasCvsError || hasCostcoError;

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <a href="#" className="brand-anchor" onClick={(e) => e.preventDefault()}>
            <div className="brand-logo-icon">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="brand-name">
                FSA Deal Tracker
                <span className="fsa-verified-tag">FSA / HSA</span>
              </div>
            </div>
          </a>

          {/* Retailer Live Heartbeat Pills */}
          <div className="retailer-health-group">
            <div
              className="health-pill"
              title={`CVS: ${status.cvs.status === "success" ? "Online" : status.cvs.status} (${status.cvs.itemCount} items)`}
            >
              <span className="pulsing-dot-wrap">
                <span className={`pulsing-dot ${getHealthDotClass(status.cvs.status)}`} />
              </span>
              <span>CVS:</span>
              <strong>{status.cvs.status === "success" ? "Online" : "Protected"}</strong>
              <span style={{ opacity: 0.6 }}>•</span>
              <span className="timestamp font-mono">{formatTimeAgo(status.cvs.lastSuccess || status.cvs.lastAttempt)}</span>
            </div>

            <div
              className="health-pill"
              title={`Costco: ${status.costco.status === "success" ? "Online" : status.costco.status} (${status.costco.itemCount} items)`}
            >
              <span className="pulsing-dot-wrap">
                <span className={`pulsing-dot ${getHealthDotClass(status.costco.status)}`} />
              </span>
              <span>Costco:</span>
              <strong>{status.costco.status === "success" ? "Online" : "Protected"}</strong>
              <span style={{ opacity: 0.6 }}>•</span>
              <span className="timestamp font-mono">{formatTimeAgo(status.costco.lastSuccess || status.costco.lastAttempt)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            title="Trigger on-demand retailer discovery"
          >
            <RefreshCw size={14} className={isRefreshing ? "spin-icon" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenImportModal}
            title="Manage watchlist or import custom deals"
          >
            <PlusCircle size={14} />
            <span>Watchlist / Import</span>
          </button>

          <button
            className="btn btn-ghost"
            onClick={onExportCsv}
            title="Export currently filtered grid data as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-icon-only"
            onClick={onToggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle color theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {anyError && (
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            padding: "0.4rem 1.25rem 0.5rem 1.25rem"
          }}
        >
          <div
            style={{
              backgroundColor: "var(--amber-light)",
              border: "1px solid var(--amber-border)",
              color: "var(--amber)",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem 0.85rem",
              fontSize: "0.775rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <div>
              <strong>Retailer Bot Guard Warning:</strong>{" "}
              {hasCvsError && <span>CVS: {status.cvs.errorMessage || "Akamai Bot challenge active. "}</span>}
              {hasCostcoError && <span>Costco: {status.costco.errorMessage || "Akamai WAF active. "}</span>}
              <span style={{ opacity: 0.9 }}>
                Prior valid price snapshots remain active. Use the 1-click Bookmarklet in "Watchlist / Import" to feed fresh deals directly.
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
