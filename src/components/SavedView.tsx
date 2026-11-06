import React, { useState, useEffect } from "react";
import { ProductObservation } from "../types/product";
import { ProductCard } from "./ProductCard";
import {
  Bookmark,
  Download,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  ScanBarcode,
  Tag,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { ScanHistoryService } from "../services/ScanHistoryService";
import { ScanHistoryItem } from "../types/scanner";

interface SavedViewProps {
  products: ProductObservation[];
  savedIds: string[];
  onToggleSave: (product: ProductObservation) => void;
  onClearSaved: () => void;
  onSelectProduct: (product: ProductObservation) => void;
  onGoToDeals: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  watchlistUrls: string[];
  onAddWatchlistUrl: (url: string) => void;
  onInspectScannedProduct?: (item: ScanHistoryItem) => void;
  onGoToScan?: () => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  products,
  savedIds,
  onToggleSave,
  onClearSaved,
  onSelectProduct,
  onGoToDeals,
  onOpenImportModal,
  onExportCsv,
  watchlistUrls,
  onAddWatchlistUrl,
  onInspectScannedProduct,
  onGoToScan
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"scans" | "deals">("scans");
  const [newUrl, setNewUrl] = useState("");
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [savedScans, setSavedScans] = useState<ScanHistoryItem[]>([]);

  const loadSavedScans = () => {
    setSavedScans(ScanHistoryService.getSaved());
  };

  useEffect(() => {
    loadSavedScans();
  }, []);

  // Match saved deals
  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onAddWatchlistUrl(newUrl.trim());
      setNewUrl("");
    }
  };

  const handleDeleteSavedScan = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    ScanHistoryService.toggleFavorite(id);
    loadSavedScans();
  };

  const handleExportScansCsv = () => {
    ScanHistoryService.exportCsv();
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
    <div className="saved-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.25rem 3.5rem 1.25rem" }}>
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="saved-subtabs-group">
          <button
            type="button"
            className={`saved-subtab-btn ${activeSubTab === "scans" ? "active" : ""}`}
            onClick={() => setActiveSubTab("scans")}
          >
            <ScanBarcode size={14} />
            <span>In-Store Scans ({savedScans.length})</span>
          </button>
          <button
            type="button"
            className={`saved-subtab-btn ${activeSubTab === "deals" ? "active" : ""}`}
            onClick={() => setActiveSubTab("deals")}
          >
            <Tag size={14} />
            <span>Online Deals ({savedProducts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "scans" ? (
            <button
              type="button"
              className="editorial-action-chip"
              onClick={handleExportScansCsv}
            >
              <Download size={13} /> Export Scans CSV
            </button>
          ) : (
            <>
              {savedProducts.length > 0 && (
                <button
                  type="button"
                  className="editorial-action-chip text-rose-400"
                  onClick={onClearSaved}
                  title="Clear all saved deals"
                >
                  <Trash2 size={13} /> Clear Deals
                </button>
              )}
              <button
                type="button"
                className="editorial-action-chip"
                onClick={onExportCsv}
              >
                <Download size={13} /> Export Deals CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === "scans" ? (
        /* 1. Saved In-Store Scans */
        <div>
          {savedScans.length === 0 ? (
            <div className="saved-empty-card">
              <div className="saved-empty-icon-box">
                <ScanBarcode size={32} stroke="var(--lavender)" />
              </div>
              <h3 className="saved-empty-heading">No saved in-store scans</h3>
              <p className="saved-empty-desc">
                When you scan a product in-store and tap <strong>Save Item</strong>, it will appear here with its full FSA eligibility determination and proof.
              </p>
              {onGoToScan && (
                <button
                  type="button"
                  className="editorial-primary-btn"
                  onClick={onGoToScan}
                >
                  <ScanBarcode size={16} />
                  <span>Start Scanning Products</span>
                </button>
              )}
            </div>
          ) : (
            <div className="recent-scans-list">
              {savedScans.map((item) => (
                <div
                  key={item.id}
                  className="recent-scan-item-card"
                  onClick={() => onInspectScannedProduct && onInspectScannedProduct(item)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {renderStatusBadge(item.eligibilityStatus)}
                      {item.storeName && (
                        <span className="text-xs text-muted">@ {item.storeName}</span>
                      )}
                      {item.price != null && (
                        <span className="text-xs font-mono font-bold text-white">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <h4 className="recent-scan-name">{item.name}</h4>
                    <p className="text-xs text-muted mt-1">
                      UPC: {item.barcode} • {item.category} • Saved on {new Date(item.scannedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="p-2 text-muted hover:text-rose-400 transition-colors"
                    onClick={(e) => handleDeleteSavedScan(e, item.id)}
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 2. Saved Deals & Bookmarked Products */
        <div>
          {savedProducts.length === 0 ? (
            <div className="saved-empty-card">
              <div className="saved-empty-icon-box">
                <Bookmark size={32} stroke="var(--lavender)" />
              </div>
              <h3 className="saved-empty-heading">No saved deals yet</h3>
              <p className="saved-empty-desc">
                Tap the bookmark icon on any item in <strong>Deals</strong> to keep track of its price history and alerts here.
              </p>
              <button
                type="button"
                className="btn btn-primary font-sans"
                onClick={onGoToDeals}
                style={{ borderRadius: "var(--radius-pill)", padding: "0.6rem 1.4rem", fontWeight: 700 }}
              >
                <Sparkles size={15} />
                <span>Explore Active Deals</span>
              </button>
            </div>
          ) : (
            <div className="mobile-cards-grid" style={{ marginBottom: "2rem" }}>
              {savedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Watchlist URLs Section */}
      <div className="saved-watchlist-card mt-6">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer"
          }}
          onClick={() => setShowWatchlist((prev) => !prev)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LinkIcon size={16} style={{ color: "var(--lavender)" }} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Automated Watchlist URLs</span>
            <span className="badge badge-subtle font-mono" style={{ fontSize: "0.7rem" }}>
              {watchlistUrls.length}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost font-sans"
            style={{ fontSize: "0.775rem", padding: "0.25rem 0.6rem" }}
          >
            {showWatchlist ? "Hide" : "Manage"}
          </button>
        </div>

        {showWatchlist && (
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              URLs monitored by the backend scraper and Playwright bot:
            </p>

            <form onSubmit={handleAddUrl} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="url"
                className="pill-input font-sans"
                placeholder="Paste CVS, Costco, Amazon, or Ralphs product URL..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                style={{ flex: 1, fontSize: "0.825rem" }}
              />
              <button
                type="submit"
                className="btn btn-primary font-sans"
                style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1rem", fontSize: "0.8rem" }}
              >
                <PlusCircle size={14} />
                <span>Add URL</span>
              </button>
            </form>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {watchlistUrls.map((url, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-subtle)",
                    fontSize: "0.775rem"
                  }}
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-lavender"
                    style={{ textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}
                  >
                    {url}
                  </a>
                  <ExternalLink size={12} style={{ opacity: 0.5 }} />
                </li>
              ))}
            </ul>

            <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary font-sans"
                onClick={onOpenImportModal}
                style={{ fontSize: "0.775rem", borderRadius: "var(--radius-pill)", padding: "0.4rem 0.85rem" }}
              >
                Open 1-Click Bookmarklet & Custom Importer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
