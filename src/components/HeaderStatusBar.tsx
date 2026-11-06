import React from "react";
import { TrackerStatus } from "../types/product";
import {
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  Clock,
  Download
} from "lucide-react";

interface HeaderStatusBarProps {
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
}

export const HeaderStatusBar: React.FC<HeaderStatusBarProps> = ({
  status,
  isRefreshing,
  onRefreshAll,
  onOpenImportModal,
  onExportCsv
}) => {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
    } catch {
      return "Unknown";
    }
  };

  const hasCvsError = status.cvs.status === "error" || status.cvs.status === "blocked_waf";
  const hasCostcoError = status.costco.status === "error" || status.costco.status === "blocked_waf";
  const anyError = hasCvsError || hasCostcoError;

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="brand-title">
              Personal FSA Deal Tracker
              <span className="brand-badge">FSA / HSA Eligible</span>
            </div>
            <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Automated price intelligence & discount monitoring for CVS and Costco
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={onOpenImportModal}
            title="Import items or manage watchlist URLs"
          >
            <PlusCircle size={16} />
            Watchlist / Import
          </button>

          <button
            className="btn btn-secondary"
            onClick={onExportCsv}
            title="Export filtered product list to CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            className="btn btn-primary"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            title="Trigger on-demand scraper check"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-icon" : ""} />
            {isRefreshing ? "Refreshing..." : "Manual Refresh"}
          </button>
        </div>
      </div>

      <div className="status-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
          <Clock size={14} /> Retailer Heartbeat:
        </div>

        <div className="retailer-status-item">
          <span className={`status-dot ${status.cvs.status}`} />
          <strong>CVS:</strong>
          <span>{status.cvs.status === "success" ? "Healthy" : status.cvs.status}</span>
          <span>• Last sync: {formatTime(status.cvs.lastSuccess || status.cvs.lastAttempt)}</span>
          <span>({status.cvs.itemCount} items)</span>
        </div>

        <div className="retailer-status-item">
          <span className={`status-dot ${status.costco.status}`} />
          <strong>Costco:</strong>
          <span>{status.costco.status === "success" ? "Healthy" : status.costco.status}</span>
          <span>• Last sync: {formatTime(status.costco.lastSuccess || status.costco.lastAttempt)}</span>
          <span>({status.costco.itemCount} items)</span>
        </div>
      </div>

      {anyError && (
        <div className="alert-banner">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Retailer Bot Protection or Collection Warning:</strong>
            {hasCvsError && (
              <div>
                • CVS: {status.cvs.errorMessage || "HTTP 403 / Akamai Bot challenge encountered."}
              </div>
            )}
            {hasCostcoError && (
              <div>
                • Costco: {status.costco.errorMessage || "HTTP 403 / Cloudflare WAF block encountered."}
              </div>
            )}
            <div style={{ marginTop: "4px", fontSize: "0.75rem", opacity: 0.9 }}>
              Tip: Previous valid snapshots are safely retained. You can use the "Watchlist / Import" modal or the 1-click Bookmarklet to feed fresh prices directly from your authenticated browser session.
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
