import React, { useState } from "react";
import { TrackerStatus, StructuredError } from "../types/product";
import {
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Download,
  Sun,
  Moon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookmarkCheck
} from "lucide-react";
import { formatSourceLabel } from "../utils/sourceTypeHelper";

interface HeaderStatusBarProps {
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

/**
 * Extracts and parses structured diagnostic errors cleanly without string concatenation defects.
 */
function extractDiagnosticErrors(status: TrackerStatus): StructuredError[] {
  const list: StructuredError[] = [];

  const processRetailer = (
    retailer: "CVS" | "Costco",
    retStatus: TrackerStatus["cvs"] | TrackerStatus["costco"]
  ) => {
    // 1. If explicit structuredErrors array is present, use it directly
    if (retStatus.structuredErrors && retStatus.structuredErrors.length > 0) {
      list.push(...retStatus.structuredErrors);
      return;
    }

    const hasIssue =
      retStatus.status === "blocked_waf" ||
      retStatus.status === "rate_limited" ||
      retStatus.status === "error";

    if (!hasIssue) return;

    // 2. Parse from errorMessage if present
    if (retStatus.errorMessage) {
      const parts = retStatus.errorMessage.split(/;\s*|\n+/).filter(Boolean);
      for (const part of parts) {
        const statusMatch = part.match(/HTTP\s+(\d+)/i);
        const urlMatch = part.match(/(https?:\/\/[^\s;]+)/i);
        const statusCode = statusMatch
          ? `HTTP ${statusMatch[1]}`
          : retStatus.status === "rate_limited"
          ? "HTTP 429"
          : "HTTP 403";
        const url = urlMatch
          ? urlMatch[1]
          : retailer === "CVS"
          ? "https://www.cvs.com"
          : "https://www.costco.com";

        let message = part.replace(/(https?:\/\/[^\s;]+)/gi, "").trim();
        if (message.startsWith(`${statusCode}:`)) {
          message = message.slice(statusCode.length + 1).trim();
        }
        if (!message) {
          message =
            retStatus.diagnosticDetails ||
            `${retailer} rate-limit or bot protection active`;
        }

        list.push({
          retailer,
          statusCode,
          url,
          message,
          timestamp: retStatus.lastAttempt || new Date().toISOString()
        });
      }
    } else if (retStatus.diagnosticDetails) {
      list.push({
        retailer,
        statusCode: retStatus.status === "rate_limited" ? "HTTP 429" : "HTTP 403",
        url: retailer === "CVS" ? "https://www.cvs.com" : "https://www.costco.com",
        message: retStatus.diagnosticDetails,
        timestamp: retStatus.lastAttempt || new Date().toISOString()
      });
    }
  };

  processRetailer("CVS", status.cvs);
  processRetailer("Costco", status.costco);

  return list;
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
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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

  const diagnostics = extractDiagnosticErrors(status);
  const hasCvsError =
    status.cvs.status === "error" ||
    status.cvs.status === "blocked_waf" ||
    status.cvs.status === "rate_limited";
  const hasCostcoError =
    status.costco.status === "error" ||
    status.costco.status === "blocked_waf" ||
    status.costco.status === "rate_limited";
  const anyBotGuardIssue = hasCvsError || hasCostcoError || diagnostics.length > 0;

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
              <span className="timestamp font-mono">
                {formatTimeAgo(status.cvs.lastSuccess || status.cvs.lastAttempt)}
              </span>
              {status.cvs.lastSourceType && (
                <span className={`source-type-pill ${status.cvs.lastSourceType}`}>
                  {formatSourceLabel(status.cvs.lastSourceType)}
                </span>
              )}
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
              <span className="timestamp font-mono">
                {formatTimeAgo(status.costco.lastSuccess || status.costco.lastAttempt)}
              </span>
              {status.costco.lastSourceType && (
                <span className={`source-type-pill ${status.costco.lastSourceType}`}>
                  {formatSourceLabel(status.costco.lastSourceType)}
                </span>
              )}
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

      {/* Retailer Bot Guard Notice Single-Line Status Bar & Expandable Diagnostics */}
      {anyBotGuardIssue && (
        <div className="bot-guard-wrapper">
          <div className="bot-guard-bar">
            <div className="bot-guard-main">
              <AlertTriangle size={16} className="bot-guard-icon" />
              <div className="bot-guard-text">
                <strong>Retailer Bot Guard Notice:</strong>
                <span>Live cloud sync was rate-limited or blocked. Prior verified price snapshots remain active.</span>
              </div>
            </div>

            <div className="bot-guard-actions">
              <button
                type="button"
                className="btn-bookmarklet"
                onClick={onOpenImportModal}
                title="Open 1-Click Bookmarklet to sync fresh deals directly from your browser"
              >
                <BookmarkCheck size={13} />
                <span>1-Click Bookmarklet Sync</span>
              </button>

              <button
                type="button"
                className="btn-diagnostics-toggle"
                onClick={() => setShowDiagnostics((prev) => !prev)}
                title={showDiagnostics ? "Hide diagnostic details" : "View diagnostic error logs"}
              >
                <span>View Diagnostics ({diagnostics.length})</span>
                {showDiagnostics ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Clean, properly padded expandable list */}
          {showDiagnostics && (
            <div className="diagnostics-drawer">
              <div className="diagnostics-header">
                <span>Active Connection Diagnostics</span>
                <span className="font-mono" style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                  {diagnostics.length} {diagnostics.length === 1 ? "issue" : "issues"} recorded
                </span>
              </div>
              <ul className="diagnostics-list">
                {diagnostics.map((err, idx) => {
                  const isCvs = err.retailer === "CVS";
                  return (
                    <li
                      key={`${err.retailer}-${err.url}-${idx}`}
                      className="diagnostic-row"
                    >
                      <span className={`diagnostic-badge-retailer ${isCvs ? "cvs" : "costco"}`}>
                        {err.retailer}
                      </span>
                      <span className="diagnostic-badge-status font-mono">
                        {err.statusCode}
                      </span>
                      <div className="diagnostic-url-wrap">
                        <a
                          href={err.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="diagnostic-url"
                          title={err.url}
                        >
                          {err.url}
                        </a>
                        <ExternalLink size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                      </div>
                      {err.message && (
                        <span className="diagnostic-message font-mono">
                          {err.message}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
