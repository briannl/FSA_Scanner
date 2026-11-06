import React from "react";
import { BottomSheet } from "./BottomSheet";
import { FSAFEDS_CATEGORIES } from "../types/fsafeds";
import { Check } from "lucide-react";

interface CategoryFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  counts: Record<string, number>;
}

export const CategoryFilterSheet: React.FC<CategoryFilterSheetProps> = ({
  isOpen,
  onClose,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClearAll,
  counts
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="FSAFEDS Categories"
      subtitle="Eligible medical & health categories per IRS Section 213(d)"
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
            All Categories
          </button>
          <button
            type="button"
            className="btn btn-primary font-sans"
            onClick={onClose}
            style={{ flex: 2, borderRadius: "var(--radius-pill)", padding: "0.75rem", fontWeight: 700 }}
          >
            Done ({selectedCategories.length === 0 ? "All" : selectedCategories.length})
          </button>
        </div>
      }
    >
      <div className="filter-sheet-list">
        {FSAFEDS_CATEGORIES.map((cat) => {
          const isChecked = selectedCategories.length === 0 || selectedCategories.includes(cat);
          const count = counts[cat] || 0;

          return (
            <button
              type="button"
              key={cat}
              className={`filter-sheet-item ${isChecked && selectedCategories.length > 0 ? "selected" : ""}`}
              onClick={() => onToggleCategory(cat)}
            >
              <div className="filter-sheet-item-left">
                <div className={`filter-sheet-checkbox ${isChecked ? "checked" : ""}`}>
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="filter-sheet-item-name-group">
                  <span className="filter-sheet-item-name">{cat}</span>
                </div>
              </div>

              <span className={`filter-sheet-item-count font-mono ${count > 0 ? "text-lime" : ""}`} style={{ opacity: count > 0 ? 1 : 0.4 }}>
                {count} {count === 1 ? "item" : "items"}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
