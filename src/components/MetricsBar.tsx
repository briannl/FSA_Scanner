import React from "react";
import { ProductObservation } from "../types/product";
import {
  Tag,
  Sparkles,
  TrendingDown,
  Award
} from "lucide-react";

export type KpiFilterType = "none" | "active_deals" | "best_discount" | "recent_drops" | "all_time_low";

interface MetricsBarProps {
  products: ProductObservation[];
  activeKpiFilter: KpiFilterType;
  onSelectKpiFilter: (filter: KpiFilterType) => void;
  onInspectProduct?: (product: ProductObservation) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  products,
  activeKpiFilter,
  onSelectKpiFilter,
  onInspectProduct
}) => {
  // 1. Active Deals (discountPercent > 0 or discountAmount > 0)
  const deals = products.filter(
    (p) => (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed"
  );
  const cvsDeals = deals.filter((p) => p.retailer === "CVS").length;
  const costcoDeals = deals.filter((p) => p.retailer === "Costco").length;

  // 2. Best Discount Right Now
  const sortedByDiscount = [...deals].sort((a, b) => b.discountPercent - a.discountPercent);
  const bestDeal = sortedByDiscount[0] || null;

  // 3. Recent Price Drops
  const recentDrops = products.filter((p) => p.isRecentDrop);

  // 4. At Historical Low
  const atHistoricalLows = products.filter(
    (p) =>
      p.lowestHistoricalPrice !== null &&
      p.currentPrice !== null &&
      p.currentPrice <= p.lowestHistoricalPrice
  );

  const handleCardClick = (filter: KpiFilterType, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectKpiFilter(activeKpiFilter === filter ? "none" : filter);
  };

  return (
    <div className="kpi-ribbon" role="region" aria-label="Key Performance Indicators">
      {/* KPI 1: Active Deals Tracked */}
      <div
        className={`kpi-card ${activeKpiFilter === "active_deals" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("active_deals", e)}
        tabIndex={0}
        role="button"
        title="Click to toggle active discounted deals only"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("active_deals", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">Active Deals Tracked</span>
          <div className="kpi-icon-badge blue">
            <Tag size={15} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{deals.length}</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>verified deals</span>
        </div>
        <div className="kpi-footer font-mono">
          <span>{cvsDeals} CVS</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{costcoDeals} Costco</span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--primary)" }}>
            {activeKpiFilter === "active_deals" ? "Active Filter ✕" : "Filter"}
          </span>
        </div>
      </div>

      {/* KPI 2: Best Discount Right Now */}
      <div
        className={`kpi-card ${activeKpiFilter === "best_discount" ? "active-filter" : ""}`}
        onClick={(e) => {
          if (bestDeal && onInspectProduct) {
            onInspectProduct(bestDeal);
          } else {
            handleCardClick("best_discount", e);
          }
        }}
        tabIndex={0}
        role="button"
        title="Click to inspect the top verified discount"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("best_discount", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">Best Discount Right Now</span>
          <div className="kpi-icon-badge emerald">
            <Sparkles size={15} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value" style={{ color: "var(--emerald)" }}>
            {bestDeal ? `-${bestDeal.discountPercent.toFixed(1)}%` : "0%"}
          </span>
          {bestDeal && (
            <span style={{ fontSize: "0.8rem", color: "var(--emerald)", fontWeight: 600 }}>
              (Save ${bestDeal.discountAmount.toFixed(2)})
            </span>
          )}
        </div>
        <div className="kpi-footer">
          <span className="accent" title={bestDeal ? bestDeal.name : "None"}>
            {bestDeal ? `${bestDeal.retailer}: ${bestDeal.name.slice(0, 24)}...` : "No active sales"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--emerald)" }}>
            Inspect ↗
          </span>
        </div>
      </div>

      {/* KPI 3: Recent Price Drops */}
      <div
        className={`kpi-card ${activeKpiFilter === "recent_drops" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("recent_drops", e)}
        tabIndex={0}
        role="button"
        title="Click to filter products with recent price drops"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("recent_drops", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">Recent Price Drops</span>
          <div className="kpi-icon-badge amber">
            <TrendingDown size={15} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{recentDrops.length}</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>new drops today</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: "var(--amber)", fontWeight: 600 }}>
            {recentDrops.length > 0 ? "Lower than prior check" : "Stable prices"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--amber)" }}>
            {activeKpiFilter === "recent_drops" ? "Active Filter ✕" : "Filter"}
          </span>
        </div>
      </div>

      {/* KPI 4: At Historical Low */}
      <div
        className={`kpi-card ${activeKpiFilter === "all_time_low" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("all_time_low", e)}
        tabIndex={0}
        role="button"
        title="Click to filter products currently sitting at their all-time lowest price"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("all_time_low", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">At Historical Low</span>
          <div className="kpi-icon-badge purple">
            <Award size={15} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{atHistoricalLows.length}</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>all-time lowest</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: "#9333ea", fontWeight: 600 }}>Prime buying window</span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#9333ea" }}>
            {activeKpiFilter === "all_time_low" ? "Active Filter ✕" : "Filter"}
          </span>
        </div>
      </div>
    </div>
  );
};
