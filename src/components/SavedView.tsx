import React, { useState } from "react";
import { ProductObservation } from "../types/product";
import { ProductCard } from "./ProductCard";
import {
  Bookmark,
  Download,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";

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
  onAddWatchlistUrl
}) => {
  const [newUrl, setNewUrl] = useState("");
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Match saved products
  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onAddWatchlistUrl(newUrl.trim());
      setNewUrl("");
    }
  };

  return (
    <div className="saved-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.25rem 2.5rem 1.25rem" }}>
      {/* Header bar */}
      <div className="saved-header-row">
        <div>
          <h2 className="saved-title">Saved Deals</h2>
          <p className="saved-subtitle">
            {savedProducts.length} {savedProducts.length === 1 ? "deal" : "deals"} bookmarked for price monitoring
          </p>
        </div>

        <div className="saved-actions-group">
          {savedProducts.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost font-sans"
              onClick={onClearSaved}
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-pill)" }}
            >
              Clear All
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={onExportCsv}
            title="Export saved products to CSV"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", borderRadius: "var(--radius-pill)" }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content: Saved Cards or Empty State */}
      {savedProducts.length === 0 ? (
        <div className="saved-empty-card">
          <div className="saved-empty-icon-box">
            <Bookmark size={32} stroke="var(--lavender)" />
          </div>
          <h3 className="saved-empty-heading">No saved deals yet</h3>
          <p className="saved-empty-desc">
            Tap the bookmark icon on any item in <strong>Deals</strong> or <strong>Discover</strong> to keep track of its price history and alerts here.
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

      {/* Watchlist URLs & Manual Import Section */}
      <div className="saved-watchlist-card">
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
              URLs monitored on a scheduled basis by the backend scraper and Playwright bot:
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
