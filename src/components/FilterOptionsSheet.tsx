import React from "react";
import { BottomSheet } from "./BottomSheet";
import { MapPin, Percent } from "lucide-react";

interface FilterOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  discountedOnly: boolean;
  onDiscountedOnlyChange: (val: boolean) => void;
  priceDropsOnly: boolean;
  onPriceDropsOnlyChange: (val: boolean) => void;
  minDiscountPercent: number;
  onMinDiscountPercentChange: (val: number) => void;
  zipCode: string;
  onZipCodeChange: (val: string) => void;
  onReset: () => void;
}

export const FilterOptionsSheet: React.FC<FilterOptionsSheetProps> = ({
  isOpen,
  onClose,
  discountedOnly,
  onDiscountedOnlyChange,
  priceDropsOnly,
  onPriceDropsOnlyChange,
  minDiscountPercent,
  onMinDiscountPercentChange,
  zipCode,
  onZipCodeChange,
  onReset
}) => {
  const discountTiers = [0, 15, 25, 35];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Advanced Filters"
      subtitle="Refine by discount depth, price drops, and store location"
      onClearAll={onReset}
      clearLabel="Reset All"
      footer={
        <button
          type="button"
          className="btn btn-primary font-sans"
          onClick={onClose}
          style={{ width: "100%", borderRadius: "var(--radius-pill)", padding: "0.85rem", fontWeight: 700 }}
        >
          Apply Filters
        </button>
      }
    >
      <div className="filter-options-content">
        {/* Toggle 1: Discounted Only */}
        <div className="filter-toggle-row">
          <div className="filter-toggle-text">
            <span className="filter-toggle-title">Discounted Only</span>
            <span className="filter-toggle-desc">Show only verified deals with an active price markdown</span>
          </div>
          <label className="ios-switch">
            <input
              type="checkbox"
              checked={discountedOnly}
              onChange={(e) => onDiscountedOnlyChange(e.target.checked)}
            />
            <span className="ios-slider" />
          </label>
        </div>

        {/* Toggle 2: Recent Price Drops */}
        <div className="filter-toggle-row">
          <div className="filter-toggle-text">
            <span className="filter-toggle-title">Recent Price Drops</span>
            <span className="filter-toggle-desc">Highlight items that dropped in price during the last observation</span>
          </div>
          <label className="ios-switch">
            <input
              type="checkbox"
              checked={priceDropsOnly}
              onChange={(e) => onPriceDropsOnlyChange(e.target.checked)}
            />
            <span className="ios-slider" />
          </label>
        </div>

        {/* Tier Selector: Minimum Savings */}
        <div className="filter-section-block">
          <div className="filter-section-label">
            <Percent size={14} className="text-lime" />
            <span>Minimum Savings Threshold</span>
          </div>
          <div className="filter-tier-chips">
            {discountTiers.map((tier) => (
              <button
                type="button"
                key={tier}
                className={`filter-tier-chip ${minDiscountPercent === tier ? "active" : ""}`}
                onClick={() => onMinDiscountPercentChange(tier)}
              >
                {tier === 0 ? "Any %" : `${tier}%+ Off`}
              </button>
            ))}
          </div>
        </div>

        {/* Location / ZIP Code */}
        <div className="filter-section-block">
          <div className="filter-section-label">
            <MapPin size={14} style={{ color: "var(--lavender)" }} />
            <span>Nearby Store Distance (ZIP Code)</span>
          </div>
          <div className="filter-zip-input-row">
            <input
              type="text"
              maxLength={5}
              pattern="[0-9]*"
              className="pill-input font-mono"
              placeholder="e.g. 90210"
              value={zipCode}
              onChange={(e) => onZipCodeChange(e.target.value.replace(/\D/g, ""))}
              style={{ width: "120px", textAlign: "center", fontSize: "0.95rem" }}
            />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Calculates driving distance to nearby physical stores
            </span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
