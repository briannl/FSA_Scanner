import React, { useState } from "react";
import { ProductObservation } from "../types/product";
import { ProductGrid } from "./ProductGrid";
import {
  TrendingDown,
  Award,
  Sparkles,
  Download,
  Table as TableIcon,
  BarChart3,
  Search,
  X
} from "lucide-react";

interface InsightsViewProps {
  products: ProductObservation[];
  onInspectProduct: (product: ProductObservation) => void;
  onExportCsv: () => void;
  isDarkMode: boolean;
  isTablet?: boolean;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  products,
  onInspectProduct,
  onExportCsv,
  isDarkMode,
  isTablet = false
}) => {
  const [viewTab, setViewTab] = useState<"spreadsheet" | "analytics">("spreadsheet");
  const [searchText, setSearchText] = useState("");

  const drops = products.filter((p) => p.isRecentDrop);
  const historicalLows = products.filter(
    (p) =>
      p.lowestHistoricalPrice !== null &&
      p.currentPrice !== null &&
      p.currentPrice <= p.lowestHistoricalPrice
  );
  const bestDiscounts = products.filter((p) => p.discountPercent >= 20);

  return (
    <div className="insights-container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.25rem 3rem 1.25rem" }}>
      {/* Top Header Row */}
      <div className="saved-header-row" style={{ alignItems: "center" }}>
        <div>
          <h2 className="saved-title">Insights & Spreadsheet</h2>
          <p className="saved-subtitle">
            Price drop signals, historical lows, and full multi-attribute data grid
          </p>
        </div>

        <div className="saved-actions-group">
          {/* View Tab Toggle */}
          <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "var(--bg-subtle)", padding: "0.2rem", borderRadius: "var(--radius-pill)" }}>
            <button
              type="button"
              className={`pill-tab ${viewTab === "spreadsheet" ? "active" : ""}`}
              onClick={() => setViewTab("spreadsheet")}
              style={{ fontSize: "0.775rem", padding: "0.35rem 0.85rem" }}
            >
              <TableIcon size={14} />
              <span>Spreadsheet</span>
            </button>
            <button
              type="button"
              className={`pill-tab ${viewTab === "analytics" ? "active" : ""}`}
              onClick={() => setViewTab("analytics")}
              style={{ fontSize: "0.775rem", padding: "0.35rem 0.85rem" }}
            >
              <BarChart3 size={14} />
              <span>Signals</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={onExportCsv}
            style={{ borderRadius: "var(--radius-pill)", fontSize: "0.775rem", padding: "0.4rem 0.85rem" }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {viewTab === "analytics" ? (
        /* Analytical Signals Ribbon */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* Box 1 */}
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Recent Price Drops
                </span>
                <TrendingDown size={18} style={{ color: "var(--lime)" }} />
              </div>
              <div className="font-mono text-lime" style={{ fontSize: "2rem", fontWeight: 800 }}>
                {drops.length}
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                Items that decreased in price on the latest scan
              </p>
            </div>

            {/* Box 2 */}
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  At Historical Low
                </span>
                <Award size={18} style={{ color: "var(--lavender)" }} />
              </div>
              <div className="font-mono" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--lavender)" }}>
                {historicalLows.length}
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                Matching or beating their lowest recorded price
              </p>
            </div>

            {/* Box 3 */}
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Top Discounts (20%+ Off)
                </span>
                <Sparkles size={18} style={{ color: "var(--lime)" }} />
              </div>
              <div className="font-mono text-lime" style={{ fontSize: "2rem", fontWeight: 800 }}>
                {bestDiscounts.length}
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                High-yield deals with over 20% verified savings
              </p>
            </div>
          </div>

          {/* Quick list of drops */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.85rem" }}>
              Recorded Price Drop Events
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {drops.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onInspectProduct(p)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-subtle)",
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{p.name}</span>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {p.retailer} • {p.category}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="font-mono text-lime" style={{ fontWeight: 700 }}>
                      ${p.currentPrice?.toFixed(2)}
                    </div>
                    {p.regularPrice && (
                      <div className="font-mono text-xs" style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>
                        ${p.regularPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Full Spreadsheet AG Grid */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Quick Filter Search */}
          <div className="deals-search-wrap">
            <Search size={15} className="deals-search-icon" />
            <input
              type="text"
              className="pill-input font-sans deals-search-input"
              placeholder="Filter grid data by product name, active ingredient, or retailer..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                className="deals-search-clear"
                onClick={() => setSearchText("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <ProductGrid
            products={products}
            quickFilterText={searchText}
            onSelectProduct={onInspectProduct}
            isDarkMode={isDarkMode}
            isTablet={isTablet}
          />
        </div>
      )}
    </div>
  );
};
