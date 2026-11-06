import React from "react";
import { ProductObservation, Retailer } from "../types/product";
import { KpiFilterType } from "./MetricsBar";
import {
  Search,
  X,
  TrendingDown,
  Award,
  Percent,
  Table as TableIcon,
  LayoutGrid
} from "lucide-react";

interface DealsSummaryBarProps {
  products: ProductObservation[];
  filteredCount: number;
  searchText: string;
  onSearchChange: (text: string) => void;
  activeDealFilter: KpiFilterType;
  onSelectDealFilter: (filter: KpiFilterType) => void;
  selectedRetailer: "All" | Retailer;
  onRetailerChange: (retailer: "All" | Retailer) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  viewMode: "table" | "card";
  onViewModeChange: (mode: "table" | "card") => void;
  isMobile?: boolean;
}

export const DealsSummaryBar: React.FC<DealsSummaryBarProps> = ({
  products,
  filteredCount,
  searchText,
  onSearchChange,
  activeDealFilter,
  onSelectDealFilter,
  selectedRetailer,
  onRetailerChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
  isMobile = false
}) => {
  // Compute metrics for quick chips
  const allDeals = products.filter(
    (p) => (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed"
  );
  const dropsCount = products.filter((p) => p.isRecentDrop).length;
  const lowsCount = products.filter(
    (p) =>
      p.lowestHistoricalPrice !== null &&
      p.currentPrice !== null &&
      p.currentPrice <= p.lowestHistoricalPrice
  ).length;
  const topDiscountCount = products.filter((p) => p.discountPercent >= 20).length;

  const maxDiscount = products.reduce((max, p) => Math.max(max, p.discountPercent || 0), 0);

  return (
    <div className="deals-toolbar-container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0.75rem 1.25rem 0.5rem 1.25rem" }}>
      {/* 1. Compact Single-Line Summary */}
      <div className="deals-compact-summary">
        <div className="deals-summary-left">
          <span className="deals-summary-highlight">
            {allDeals.length} Active Deals
          </span>
          <span className="minimal-meta-dot">•</span>
          <span className="text-lime font-mono" style={{ fontWeight: 700 }}>
            Up to {Math.round(maxDiscount)}% Off
          </span>
          {dropsCount > 0 && (
            <>
              <span className="minimal-meta-dot">•</span>
              <span style={{ color: "var(--lavender)" }}>
                {dropsCount} recent price {dropsCount === 1 ? "drop" : "drops"}
              </span>
            </>
          )}
        </div>

        {/* Desktop View Mode Toggle */}
        {!isMobile && (
          <div className="view-mode-toggle" style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              className={`pill-tab ${viewMode === "card" ? "active" : ""}`}
              onClick={() => onViewModeChange("card")}
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
              title="Card View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              className={`pill-tab ${viewMode === "table" ? "active" : ""}`}
              onClick={() => onViewModeChange("table")}
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
              title="Spreadsheet Table View"
            >
              <TableIcon size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Compact Search Input */}
      <div className="deals-search-wrap">
        <Search size={15} className="deals-search-icon" />
        <input
          type="text"
          className="pill-input font-sans deals-search-input"
          placeholder="Search deals, active ingredients, categories..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchText && (
          <button
            type="button"
            className="deals-search-clear"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. Horizontal Quick Filter Chips */}
      <div className="deals-quick-chips">
        <button
          type="button"
          className={`deal-chip ${activeDealFilter === "none" ? "active" : ""}`}
          onClick={() => onSelectDealFilter("none")}
        >
          <span>All Deals</span>
          <span className="deal-chip-count font-mono">{products.length}</span>
        </button>

        <button
          type="button"
          className={`deal-chip ${activeDealFilter === "recent_drops" ? "active" : ""}`}
          onClick={() => onSelectDealFilter(activeDealFilter === "recent_drops" ? "none" : "recent_drops")}
        >
          <TrendingDown size={13} />
          <span>Recent Drops</span>
          <span className="deal-chip-count font-mono">{dropsCount}</span>
        </button>

        <button
          type="button"
          className={`deal-chip ${activeDealFilter === "all_time_low" ? "active" : ""}`}
          onClick={() => onSelectDealFilter(activeDealFilter === "all_time_low" ? "none" : "all_time_low")}
        >
          <Award size={13} />
          <span>Historical Lows</span>
          <span className="deal-chip-count font-mono">{lowsCount}</span>
        </button>

        <button
          type="button"
          className={`deal-chip ${activeDealFilter === "best_discount" ? "active" : ""}`}
          onClick={() => onSelectDealFilter(activeDealFilter === "best_discount" ? "none" : "best_discount")}
        >
          <Percent size={13} />
          <span>20%+ Off</span>
          <span className="deal-chip-count font-mono">{topDiscountCount}</span>
        </button>
      </div>

      {/* Desktop-only secondary filter controls */}
      {!isMobile && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="pill-select font-sans"
            value={selectedRetailer}
            onChange={(e) => onRetailerChange(e.target.value as any)}
            style={{ fontSize: "0.775rem", padding: "0.3rem 0.75rem" }}
          >
            <option value="All">All Retailers</option>
            <option value="Costco">Costco</option>
            <option value="CVS">CVS</option>
            <option value="Amazon">Amazon</option>
            <option value="Ralphs">Ralphs</option>
            <option value="Vons">Vons</option>
            <option value="Instacart">Instacart</option>
            <option value="Smart & Final">Smart & Final</option>
            <option value="H Mart">H Mart</option>
            <option value="99 Ranch">99 Ranch</option>
            <option value="Trader Joe's">Trader Joe's</option>
          </select>

          <select
            className="pill-select font-sans"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{ fontSize: "0.775rem", padding: "0.3rem 0.75rem" }}
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            Showing <strong>{filteredCount}</strong> results
          </span>
        </div>
      )}
    </div>
  );
};
