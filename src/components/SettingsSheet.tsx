import React from "react";
import { BottomSheet } from "./BottomSheet";
import { TrackerStatus } from "../types/product";
import {
  RefreshCw,
  Download,
  Sun,
  Moon,
  BookmarkCheck,
  Layers
} from "lucide-react";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  status,
  isRefreshing,
  onRefreshAll,
  isDarkMode,
  onToggleTheme,
  onExportCsv,
  onOpenImportModal
}) => {
  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return "Recently";
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & Preferences"
      subtitle="Tracker configuration, retailer health, and data controls"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Appearance Toggle */}
        <div className="filter-toggle-row">
          <div>
            <span className="filter-toggle-title">Theme Mode</span>
            <span className="filter-toggle-desc">
              Currently {isDarkMode ? "Near-Black Dark" : "Soft Pastel Light"}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={onToggleTheme}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        {/* Sync Controls */}
        <div className="filter-toggle-row">
          <div>
            <span className="filter-toggle-title">Live Cloud Sync</span>
            <span className="filter-toggle-desc">
              Trigger on-demand discovery across CVS, Costco, Amazon & grocery stores
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary font-sans"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={isRefreshing ? "spin-icon" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>

        {/* Export Data */}
        <div className="filter-toggle-row">
          <div>
            <span className="filter-toggle-title">Export Products CSV</span>
            <span className="filter-toggle-desc">
              Download complete eligible catalog and discount observations
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={() => {
              onClose();
              onExportCsv();
            }}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* 1-Click Bookmarklet Sync */}
        <div className="filter-toggle-row">
          <div>
            <span className="filter-toggle-title">1-Click Bookmarklet Sync</span>
            <span className="filter-toggle-desc">
              Bypass cloud bot protection by extracting deals directly from your browser
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={() => {
              onClose();
              onOpenImportModal();
            }}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <BookmarkCheck size={14} />
            <span>Open Importer</span>
          </button>
        </div>

        {/* Retailer Health Status */}
        <div style={{ backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Layers size={13} />
            <span>Retailer Connection Status</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.825rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span className={`status-indicator-dot ${status.cvs.status === "success" ? "green" : "amber"}`} />
                <span style={{ fontWeight: 600 }}>CVS:</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
                  {status.cvs.status === "success" ? "Online" : "Protected (Prior Snapshots Retained)"}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                {formatTimeAgo(status.cvs.lastSuccess || status.cvs.lastAttempt)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.825rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span className={`status-indicator-dot ${status.costco.status === "success" ? "green" : "amber"}`} />
                <span style={{ fontWeight: 600 }}>Costco:</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
                  {status.costco.status === "success" ? "Online" : "Protected (Prior Snapshots Retained)"}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                {formatTimeAgo(status.costco.lastSuccess || status.costco.lastAttempt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
