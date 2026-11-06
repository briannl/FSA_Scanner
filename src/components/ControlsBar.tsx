import React from "react";
import { Retailer } from "../types/product";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface ControlsBarProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  selectedRetailer: "All" | Retailer;
  onRetailerChange: (val: "All" | Retailer) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  discountedOnly: boolean;
  onDiscountedOnlyChange: (val: boolean) => void;
  matchedCount: number;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  searchText,
  onSearchChange,
  selectedRetailer,
  onRetailerChange,
  selectedCategory,
  onCategoryChange,
  categories,
  discountedOnly,
  onDiscountedOnlyChange,
  matchedCount
}) => {
  return (
    <div className="controls-bar">
      <div className="search-input-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search products, brands, or symptoms..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchText && (
          <button
            className="search-clear"
            onClick={() => onSearchChange("")}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filters-group">
        <div className="segmented-control" role="group" aria-label="Retailer Filter">
          <button
            className={`segment-btn ${selectedRetailer === "All" ? "active" : ""}`}
            onClick={() => onRetailerChange("All")}
          >
            All Retailers
          </button>
          <button
            className={`segment-btn ${selectedRetailer === "CVS" ? "active" : ""}`}
            onClick={() => onRetailerChange("CVS")}
          >
            CVS
          </button>
          <button
            className={`segment-btn ${selectedRetailer === "Costco" ? "active" : ""}`}
            onClick={() => onRetailerChange("Costco")}
          >
            Costco
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <SlidersHorizontal size={15} style={{ color: "var(--text-muted)" }} />
          <select
            className="select-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Category Filter"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <label className="toggle-switch-label">
          <input
            type="checkbox"
            checked={discountedOnly}
            onChange={(e) => onDiscountedOnlyChange(e.target.checked)}
          />
          <span>Discounted Only</span>
        </label>

        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
          Showing <strong>{matchedCount}</strong> items
        </span>
      </div>
    </div>
  );
};
