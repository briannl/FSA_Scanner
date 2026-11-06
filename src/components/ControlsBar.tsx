import React, { useRef, useEffect } from "react";
import { Retailer } from "../types/product";
import {
  Search,
  X,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";

interface ControlsBarProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  selectedRetailer: "All" | Retailer;
  onRetailerChange: (val: "All" | Retailer) => void;
  retailerCounts: { all: number; cvs: number; costco: number };
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  discountedOnly: boolean;
  onDiscountedOnlyChange: (val: boolean) => void;
  priceDropsOnly: boolean;
  onPriceDropsOnlyChange: (val: boolean) => void;
  viewMode: "table" | "card";
  onViewModeChange: (mode: "table" | "card") => void;
  matchedCount: number;
  isMobile?: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  searchText,
  onSearchChange,
  selectedRetailer,
  onRetailerChange,
  retailerCounts,
  selectedCategory,
  onCategoryChange,
  categories,
  discountedOnly,
  onDiscountedOnlyChange,
  priceDropsOnly,
  onPriceDropsOnlyChange,
  viewMode,
  onViewModeChange,
  matchedCount,
  isMobile = false
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="toolbar-container">
      <div className="toolbar-card">
        {/* Main Row: Search, Retailer Segment, Switches, View Toggle */}
        <div className="toolbar-main-row">
          {/* Search Field */}
          <div className="search-wrapper">
            <Search size={15} className="search-icon-leading" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-field"
              placeholder="Search products, brands, symptoms..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search FSA products"
            />
            <div className="search-trailing-actions">
              {searchText ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => onSearchChange("")}
                  title="Clear search query"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : (
                <span className="shortcut-badge" title="Press '/' to quickly search">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Retailer Segmented Control */}
          <div className="retailer-segmented-group" role="group" aria-label="Retailer Filter">
            <button
              type="button"
              className={`retailer-tab-btn ${selectedRetailer === "All" ? "active" : ""}`}
              onClick={() => onRetailerChange("All")}
            >
              <span>All</span>
              <span className="tab-count">{retailerCounts.all}</span>
            </button>
            <button
              type="button"
              className={`retailer-tab-btn ${selectedRetailer === "CVS" ? "active" : ""}`}
              onClick={() => onRetailerChange("CVS")}
            >
              <span>CVS</span>
              <span className="tab-count">{retailerCounts.cvs}</span>
            </button>
            <button
              type="button"
              className={`retailer-tab-btn ${selectedRetailer === "Costco" ? "active" : ""}`}
              onClick={() => onRetailerChange("Costco")}
            >
              <span>Costco</span>
              <span className="tab-count">{retailerCounts.costco}</span>
            </button>
          </div>

          {/* Modern Toggle Switches & Desktop View Mode */}
          <div className="switches-group">
            <label className="custom-switch-label" title="Show only verified discounted items">
              <input
                type="checkbox"
                checked={discountedOnly}
                onChange={(e) => onDiscountedOnlyChange(e.target.checked)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span>On Sale Only</span>
            </label>

            <label className="custom-switch-label" title="Show only items with recent price drops">
              <input
                type="checkbox"
                checked={priceDropsOnly}
                onChange={(e) => onPriceDropsOnlyChange(e.target.checked)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span>Price Drops Only</span>
            </label>

            {/* View Mode Toggle: Displayed on Desktop & Tablet */}
            {!isMobile && (
              <div className="view-mode-group" role="group" aria-label="View Mode">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => onViewModeChange("table")}
                  title="Table Spreadsheet View"
                  aria-label="Table spreadsheet view"
                >
                  <TableIcon size={14} />
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "card" ? "active" : ""}`}
                  onClick={() => onViewModeChange("card")}
                  title="Card Grid View"
                  aria-label="Card grid view"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Row: Category Horizontally Scrollable Pills & Results Counter */}
        <div className="toolbar-sub-row">
          <div className="category-scroll-bar" role="tablist" aria-label="Product Categories">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === "All"}
              className={`category-pill-btn ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => onCategoryChange("All")}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`category-pill-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => onCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="matched-counter-text">
            Showing <strong style={{ color: "var(--text-main)" }} className="font-mono">{matchedCount}</strong> deals
          </div>
        </div>
      </div>
    </div>
  );
};
