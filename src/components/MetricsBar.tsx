import React from "react";
import { ProductObservation } from "../types/product";
import {
  Tag,
  Sparkles,
  TrendingDown,
  Award,
  ArrowUpRight
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
    <section className="kpi-ribbon" aria-label="Key Performance Indicators">
      {/* KPI 1: Active Deals Tracked */}
      <div
        className={`kpi-card ${activeKpiFilter === "active_deals" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("active_deals", e)}
        tabIndex={0}
        role="button"
        title="Toggle active discounted deals"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("active_deals", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">Active Deals Tracked</span>
          <div className="kpi-icon-badge lavender">
            <Tag size={16} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value font-mono">{deals.length}</span>
          <span className="kpi-subtext">verified deals</span>
        </div>
        <div className="kpi-footer font-mono">
          <span>{cvsDeals} CVS</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>{costcoDeals} Costco</span>
          <span className="kpi-pill-action font-sans">
            {activeKpiFilter === "active_deals" ? "Active ✕" : "Filter"}
          </span>
        </div>
      </div>

      {/* KPI 2: Best Discount Right Now (Lime Green Savings Accent) */}
      <div
        className={`kpi-card kpi-card-lime ${activeKpiFilter === "best_discount" ? "active-filter" : ""}`}
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
          <span className="kpi-label">Top Savings Right Now</span>
          <div className="kpi-icon-badge lime">
            <Sparkles size={16} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value font-mono text-lime">
            {bestDeal ? `-${bestDeal.discountPercent.toFixed(1)}%` : "—"}
          </span>
          {bestDeal && bestDeal.discountAmount > 0 && (
            <span className="kpi-subtext font-mono text-lime" style={{ fontWeight: 600 }}>
              (Save ${bestDeal.discountAmount.toFixed(2)})
            </span>
          )}
        </div>
        <div className="kpi-footer">
          <span className="kpi-product-summary" title={bestDeal ? `${bestDeal.retailer}: ${bestDeal.name}` : "None"}>
            {bestDeal ? `${bestDeal.retailer}: ${bestDeal.name}` : "No active discounts"}
          </span>
          <span className="kpi-pill-action font-sans" style={{ color: "var(--lime)" }}>
            Inspect <ArrowUpRight size={12} style={{ display: "inline" }} />
          </span>
        </div>
      </div>

      {/* KPI 3: Recent Price Drops */}
      <div
        className={`kpi-card ${activeKpiFilter === "recent_drops" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("recent_drops", e)}
        tabIndex={0}
        role="button"
        title="Toggle recent price drops"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("recent_drops", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">Recent Price Drops</span>
          <div className="kpi-icon-badge amber">
            <TrendingDown size={16} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value font-mono">{recentDrops.length}</span>
          <span className="kpi-subtext">new drops today</span>
        </div>
        <div className="kpi-footer font-mono">
          <span className="accent-amber">Lower than prior check</span>
          <span className="kpi-pill-action font-sans">
            {activeKpiFilter === "recent_drops" ? "Active ✕" : "Filter"}
          </span>
        </div>
      </div>

      {/* KPI 4: At Historical Low */}
      <div
        className={`kpi-card ${activeKpiFilter === "all_time_low" ? "active-filter" : ""}`}
        onClick={(e) => handleCardClick("all_time_low", e)}
        tabIndex={0}
        role="button"
        title="Toggle all-time low price deals"
        onKeyDown={(e) => e.key === "Enter" && handleCardClick("all_time_low", e as any)}
      >
        <div className="kpi-header">
          <span className="kpi-label">At All-Time Low</span>
          <div className="kpi-icon-badge lavender">
            <Award size={16} />
          </div>
        </div>
        <div className="kpi-body">
          <span className="kpi-value font-mono">{atHistoricalLows.length}</span>
          <span className="kpi-subtext">all-time lowest</span>
        </div>
        <div className="kpi-footer font-mono">
          <span className="accent-lavender">Prime buying window</span>
          <span className="kpi-pill-action font-sans">
            {activeKpiFilter === "all_time_low" ? "Active ✕" : "Filter"}
          </span>
        </div>
      </div>
    </section>
  );
};
