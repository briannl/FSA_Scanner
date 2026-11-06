import React, { useState, useEffect } from "react";
import {
  Camera,
  History,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Download,
  Trash2
} from "lucide-react";
import { ScannedProduct, ScanHistoryItem } from "../types/scanner";
import { ScanHistoryService } from "../services/ScanHistoryService";

interface ScannerHomeProps {
  onStartScanning: () => void;
  onEnterManually: () => void;
  onInspectScannedProduct: (product: ScannedProduct) => void;
  onViewAllSaved?: () => void;
}

export const ScannerHome: React.FC<ScannerHomeProps> = ({
  onStartScanning,
  onEnterManually,
  onInspectScannedProduct,
  onViewAllSaved
}) => {
  const [historyItems, setHistoryItems] = useState<ScanHistoryItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const refreshHistory = () => {
    setHistoryItems(ScanHistoryService.getHistory());
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Clear all scanned product history?")) {
      ScanHistoryService.clearHistory();
      refreshHistory();
    }
  };

  const handleExportCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    ScanHistoryService.exportCsv();
    setTimeout(() => setIsExporting(false), 1000);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Verified eligible":
        return (
          <span className="editorial-badge-discount inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Eligible
          </span>
        );
      case "Likely eligible — verify":
        return (
          <span className="editorial-badge-retailer inline-flex items-center gap-1 text-blue-300">
            Likely Eligible
          </span>
        );
      case "Requires documentation":
        return (
          <span className="editorial-badge-retailer inline-flex items-center gap-1 text-amber-300">
            <AlertTriangle size={11} /> Needs LMN
          </span>
        );
      case "Not eligible":
        return (
          <span className="editorial-badge-retailer inline-flex items-center gap-1 text-rose-300">
            <XCircle size={11} /> Not Eligible
          </span>
        );
      default:
        return (
          <span className="editorial-badge-retailer inline-flex items-center gap-1 text-slate-400">
            <HelpCircle size={11} /> Unverified
          </span>
        );
    }
  };

  return (
    <div className="editorial-homepage-container">
      {/* 1. Eyebrow */}
      <div className="scanner-hero-eyebrow">
        <span>SCAN & CHECK</span>
      </div>

      {/* 2. Editorial Title & Subtitle */}
      <div className="editorial-hero mb-6">
        <h1 className="editorial-headline">Is this FSA eligible?</h1>
        <p className="editorial-subheadline">Find out before you buy.</p>
      </div>

      {/* 3. Main Scanner Card (Pixel-accurate to mockup) */}
      <section className="editorial-scanner-card" aria-label="Barcode Viewfinder">
        <div className="scanner-reticle-box">
          {/* 4 Corner Target Brackets */}
          <span className="scanner-bracket-corner top-left" />
          <span className="scanner-bracket-corner top-right" />
          <span className="scanner-bracket-corner bottom-left" />
          <span className="scanner-bracket-corner bottom-right" />

          {/* Stylized Barcode Illustration */}
          <div className="scanner-mock-barcode" aria-hidden="true">
            <svg
              viewBox="0 0 240 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="barcode-svg"
            >
              {/* Variable thickness vertical barcode lines */}
              <rect x="10" y="5" width="4" height="90" fill="white" />
              <rect x="18" y="5" width="2" height="90" fill="white" />
              <rect x="25" y="5" width="6" height="90" fill="white" />
              <rect x="36" y="5" width="2" height="90" fill="white" />
              <rect x="43" y="5" width="4" height="90" fill="white" />
              <rect x="52" y="5" width="8" height="90" fill="white" />
              <rect x="65" y="5" width="3" height="90" fill="white" />
              <rect x="73" y="5" width="5" height="90" fill="white" />
              <rect x="83" y="5" width="2" height="90" fill="white" />
              <rect x="90" y="5" width="7" height="90" fill="white" />
              <rect x="102" y="5" width="3" height="90" fill="white" />
              <rect x="110" y="5" width="6" height="90" fill="white" />
              <rect x="121" y="5" width="2" height="90" fill="white" />
              <rect x="128" y="5" width="5" height="90" fill="white" />
              <rect x="138" y="5" width="7" height="90" fill="white" />
              <rect x="150" y="5" width="3" height="90" fill="white" />
              <rect x="158" y="5" width="4" height="90" fill="white" />
              <rect x="167" y="5" width="6" height="90" fill="white" />
              <rect x="178" y="5" width="2" height="90" fill="white" />
              <rect x="185" y="5" width="5" height="90" fill="white" />
              <rect x="195" y="5" width="3" height="90" fill="white" />
              <rect x="203" y="5" width="7" height="90" fill="white" />
              <rect x="215" y="5" width="3" height="90" fill="white" />
              <rect x="223" y="5" width="5" height="90" fill="white" />

              {/* Dotted horizontal laser guideline */}
              <line
                x1="0"
                y1="50"
                x2="240"
                y2="50"
                stroke="#A99BFF"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="scanner-center-dash"
              />
            </svg>
            <span className="barcode-format-subtext">UPC / EAN / GTIN</span>
          </div>
        </div>

        {/* Instructional Prompt */}
        <p className="scanner-card-prompt">Point your camera at a product barcode</p>

        {/* Primary White Pill Button */}
        <button
          type="button"
          className="editorial-scanner-start-btn"
          onClick={onStartScanning}
          aria-label="Start scanning with rear camera"
        >
          <Camera size={19} />
          <span>Start scanning</span>
        </button>

        {/* Secondary Action Text */}
        <div className="scanner-card-manual-action">
          <button
            type="button"
            className="scanner-manual-link-btn"
            onClick={onEnterManually}
          >
            Or enter a barcode manually
          </button>
        </div>
      </section>

      {/* 4. Recently Scanned Section */}
      <section className="recently-scanned-section" aria-label="Recently Scanned Products">
        <div className="editorial-section-header">
          <h2 className="editorial-section-title">Recently scanned</h2>
          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <>
                <button
                  type="button"
                  className="editorial-action-chip"
                  onClick={handleExportCsv}
                  title="Export scans as CSV"
                >
                  <Download size={13} /> {isExporting ? "Exporting..." : "CSV"}
                </button>
                <button
                  type="button"
                  className="editorial-action-chip text-rose-400"
                  onClick={handleClearHistory}
                  title="Clear history"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            {onViewAllSaved && (
              <button
                type="button"
                className="editorial-view-all-link"
                onClick={onViewAllSaved}
              >
                View all
              </button>
            )}
          </div>
        </div>

        {historyItems.length === 0 ? (
          /* Empty State matching mockup */
          <div
            className="editorial-empty-scan-card"
            onClick={onStartScanning}
            role="button"
            tabIndex={0}
            aria-label="Your scanned products appear here"
          >
            <div className="empty-scan-content">
              <h3 className="empty-scan-title">Your scanned products</h3>
              <p className="empty-scan-sub">Appear here after your first scan</p>
            </div>
            <div className="empty-scan-icon-bubble">
              <History size={22} className="text-muted" />
            </div>
          </div>
        ) : (
          /* Populated Recent Scans Feed */
          <div className="recent-scans-list">
            {historyItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="recent-scan-item-card"
                onClick={() => onInspectScannedProduct(item)}
                role="button"
                tabIndex={0}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    {renderStatusBadge(item.eligibilityStatus)}
                    {item.storeName && (
                      <span className="text-xs text-muted">@ {item.storeName}</span>
                    )}
                    {item.price != null && (
                      <span className="text-xs font-mono text-white">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <h4 className="recent-scan-name">{item.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted mt-1">
                    <span>UPC: {item.barcode}</span>
                    <span>•</span>
                    <span>{new Date(item.scannedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="recent-scan-arrow">
                  <ChevronRight size={18} className="text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
