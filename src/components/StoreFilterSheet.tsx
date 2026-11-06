import React from "react";
import { BottomSheet } from "./BottomSheet";
import { Retailer, RETAILER_REGISTRY } from "../types/product";
import { Check } from "lucide-react";

interface StoreFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRetailers: Retailer[];
  onToggleRetailer: (retailer: Retailer) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  counts: Record<Retailer, number>;
}

const ALL_RETAILERS: Retailer[] = [
  "Costco",
  "CVS",
  "Amazon",
  "Ralphs",
  "Vons",
  "Instacart",
  "Smart & Final",
  "H Mart",
  "99 Ranch",
  "Trader Joe's"
];

export const StoreFilterSheet: React.FC<StoreFilterSheetProps> = ({
  isOpen,
  onClose,
  selectedRetailers,
  onToggleRetailer,
  onSelectAll,
  onClearAll,
  counts
}) => {
  const activeRetailers = ALL_RETAILERS.filter((r) => (counts[r] || 0) > 0);
  const otherRetailers = ALL_RETAILERS.filter((r) => (counts[r] || 0) === 0);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Select Stores"
      subtitle="Choose which retailers to include in your search"
      onClearAll={onClearAll}
      clearLabel="Clear All"
      footer={
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={onSelectAll}
            style={{ flex: 1, borderRadius: "var(--radius-pill)", padding: "0.75rem" }}
          >
            All Stores
          </button>
          <button
            type="button"
            className="btn btn-primary font-sans"
            onClick={onClose}
            style={{ flex: 2, borderRadius: "var(--radius-pill)", padding: "0.75rem", fontWeight: 700 }}
          >
            Done ({selectedRetailers.length === 0 ? "All" : selectedRetailers.length})
          </button>
        </div>
      }
    >
      <div className="filter-sheet-section">
        <div className="filter-sheet-section-title">Active in Catalog</div>
        <div className="filter-sheet-list">
          {activeRetailers.map((r) => {
            const isChecked = selectedRetailers.length === 0 || selectedRetailers.includes(r);
            const count = counts[r] || 0;
            const capability = RETAILER_REGISTRY[r]?.capability || "watched-urls-only";

            return (
              <button
                type="button"
                key={r}
                className={`filter-sheet-item ${isChecked && selectedRetailers.length > 0 ? "selected" : ""}`}
                onClick={() => onToggleRetailer(r)}
              >
                <div className="filter-sheet-item-left">
                  <div className={`filter-sheet-checkbox ${isChecked ? "checked" : ""}`}>
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className="filter-sheet-item-name-group">
                    <span className="filter-sheet-item-name">{r}</span>
                    <span className="filter-sheet-item-subtext">
                      {capability.replace(/-/g, " ")}
                    </span>
                  </div>
                </div>

                <span className="filter-sheet-item-count font-mono">
                  {count} {count === 1 ? "offer" : "offers"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {otherRetailers.length > 0 && (
        <div className="filter-sheet-section" style={{ marginTop: "1.25rem" }}>
          <div className="filter-sheet-section-title">Configured Stores (No Current Offers)</div>
          <div className="filter-sheet-list">
            {otherRetailers.map((r) => {
              const isChecked = selectedRetailers.includes(r);
              const capability = RETAILER_REGISTRY[r]?.capability || "manual-verification-only";

              return (
                <button
                  type="button"
                  key={r}
                  className={`filter-sheet-item ${isChecked ? "selected" : ""}`}
                  onClick={() => onToggleRetailer(r)}
                >
                  <div className="filter-sheet-item-left">
                    <div className={`filter-sheet-checkbox ${isChecked ? "checked" : ""}`}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="filter-sheet-item-name-group">
                      <span className="filter-sheet-item-name" style={{ opacity: 0.75 }}>{r}</span>
                      <span className="filter-sheet-item-subtext">
                        {capability.replace(/-/g, " ")}
                      </span>
                    </div>
                  </div>

                  <span className="filter-sheet-item-count font-mono" style={{ opacity: 0.5 }}>
                    0 offers
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
