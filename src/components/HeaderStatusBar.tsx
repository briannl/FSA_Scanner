import React, { useState, useEffect, useRef } from "react";
import { TrackerStatus, StructuredError } from "../types/product";
import {
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface HeaderStatusBarProps {
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activeMode: "deals" | "discover" | "saved";
  onNavigate: (mode: "deals" | "discover" | "saved") => void;
  savedCount?: number;
  isMobile?: boolean;
}

function extractDiagnosticErrors(status: TrackerStatus): StructuredError[] {
  const list: StructuredError[] = [];

  const processRetailer = (
    retailer: "CVS" | "Costco",
    retStatus: TrackerStatus["cvs"] | TrackerStatus["costco"]
  ) => {
    if (retStatus.structuredErrors && retStatus.structuredErrors.length > 0) {
      list.push(...retStatus.structuredErrors);
      return;
    }

    const hasIssue =
      retStatus.status === "blocked_waf" ||
      retStatus.status === "rate_limited" ||
      retStatus.status === "error";

    if (!hasIssue) return;

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
  isDarkMode,
  onToggleTheme,
  activeMode,
  onNavigate,
  savedCount = 0,
  isMobile = false
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const diagnosticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDiagnostics(false);
    };
    if (showDiagnostics) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDiagnostics]);

  const diagnostics = extractDiagnosticErrors(status);
  const isCvsLimited = status.cvs.status === "blocked_waf" || status.cvs.status === "rate_limited";
  const isCostcoLimited = status.costco.status === "blocked_waf" || status.costco.status === "rate_limited";
  const isRateLimited = isCvsLimited || isCostcoLimited;

  // Format relative time
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
    <header className="minimal-app-header">
      <div className="minimal-header-inner">
        {/* Left: Compact Brand Title */}
        <div className="minimal-brand-group">
          <div className="minimal-brand-logo">
            <ShieldCheck size={18} strokeWidth={2.4} />
          </div>
          <h1 className="minimal-brand-title">FSA Tracker</h1>
        </div>

        {/* Center: Desktop-only Primary Navigation */}
        {!isMobile && (
          <nav className="minimal-desktop-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`minimal-nav-tab ${activeMode === "deals" ? "active" : ""}`}
              onClick={() => onNavigate("deals")}
            >
              Deals
            </button>
            <button
              type="button"
              className={`minimal-nav-tab ${activeMode === "discover" ? "active" : ""}`}
              onClick={() => onNavigate("discover")}
            >
              Discover
            </button>
            <button
              type="button"
              className={`minimal-nav-tab ${activeMode === "saved" ? "active" : ""}`}
              onClick={() => onNavigate("saved")}
            >
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="minimal-nav-badge font-mono">{savedCount}</span>
              )}
            </button>
          </nav>
        )}

        {/* Right: Minimal Action Icons & Small Status Indicator */}
        <div className="minimal-header-actions">
          {/* Small Expandable Sync-Status Indicator */}
          <button
            type="button"
            className={`minimal-status-chip ${isRateLimited ? "amber" : "green"} ${showDiagnostics ? "expanded" : ""}`}
            onClick={() => setShowDiagnostics((prev) => !prev)}
            title="Click to view sync diagnostics"
            aria-label="Retailer sync status"
            aria-expanded={showDiagnostics}
          >
            <span className={`status-indicator-dot ${isRateLimited ? "amber" : "green"}`} />
            <span className="minimal-status-label font-sans">
              {isRateLimited
                ? isMobile
                  ? "Cached"
                  : "Snapshots active"
                : isMobile
                ? "Live"
                : "Synced"}
            </span>
            {showDiagnostics ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Sync Button */}
          <button
            type="button"
            className="minimal-icon-btn"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            title={isRefreshing ? "Syncing..." : "Sync latest prices"}
            aria-label="Sync latest prices"
          >
            <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="minimal-icon-btn"
            onClick={onToggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* Expandable Diagnostic Drawer */}
      {showDiagnostics && (
        <div className="minimal-diagnostics-popover" ref={diagnosticsRef}>
          <div className="minimal-diag-header">
            <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>Retailer Sync Status</span>
            <span className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Updated {formatTimeAgo(status.updatedAt)}
            </span>
          </div>

          <div className="minimal-diag-retailer-row">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className={`status-indicator-dot ${status.cvs.status === "success" ? "green" : "amber"}`} />
              <span style={{ fontWeight: 600 }}>CVS:</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
                {status.cvs.status === "success" ? "Online" : "Protected (Snapshot Retained)"}
              </span>
            </div>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {formatTimeAgo(status.cvs.lastSuccess || status.cvs.lastAttempt)}
            </span>
          </div>

          <div className="minimal-diag-retailer-row">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className={`status-indicator-dot ${status.costco.status === "success" ? "green" : "amber"}`} />
              <span style={{ fontWeight: 600 }}>Costco:</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
                {status.costco.status === "success" ? "Online" : "Protected (Snapshot Retained)"}
              </span>
            </div>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {formatTimeAgo(status.costco.lastSuccess || status.costco.lastAttempt)}
            </span>
          </div>

          {diagnostics.length > 0 && (
            <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Rate-Limit / Bot Defense Logs:
              </div>
              {diagnostics.map((err, i) => (
                <div key={i} className="font-mono" style={{ fontSize: "0.68rem", color: "var(--amber)", padding: "0.2rem 0" }}>
                  [{err.retailer}] {err.statusCode}: Prior snapshot active
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
