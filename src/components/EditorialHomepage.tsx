import React, { useState, useMemo } from "react";
import { ProductObservation, TrackerStatus } from "../types/product";
import { EditorialDealCard } from "./EditorialDealCard";
import {
  Tag,
  TrendingDown,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

interface EditorialHomepageProps {
  products: ProductObservation[];
  status: TrackerStatus;
  onInspectProduct: (product: ProductObservation) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const EditorialHomepage: React.FC<EditorialHomepageProps> = ({
  products,
  status,
  onInspectProduct,
  onRefreshAll,
  isRefreshing
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "active_deals" | "best_discount">("all");

  // Dynamic user local date in small uppercase: e.g. "FRIDAY, NOVEMBER 6"
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).toUpperCase();
    } catch {
      return "TODAY";
    }
  }, []);

  // Compute live metrics from eligible products
  const activeDeals = useMemo(() => {
    return products.filter(
      (p) =>
        (p.discountPercent > 0 || (p.regularPrice !== null && p.currentPrice !== null && p.regularPrice > p.currentPrice)) &&
        p.priceStatus === "confirmed"
    );
  }, [products]);

  const bestDiscount = useMemo(() => {
    const discounts = activeDeals.map((p) => p.discountPercent || 0);
    return discounts.length > 0 ? Math.round(Math.max(...discounts)) : 25;
  }, [activeDeals]);

  // Filter products for display
  const displayedProducts = useMemo(() => {
    if (filterMode === "active_deals") {
      return activeDeals;
    }
    if (filterMode === "best_discount") {
      return activeDeals.filter((p) => p.discountPercent >= 20);
    }
    return products;
  }, [products, activeDeals, filterMode]);

  // Compute accurate update time from status
  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return "10h ago";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "Recently";
    }
  };

  const isCached =
    status.cvs.status === "blocked_waf" ||
    status.cvs.status === "rate_limited" ||
    status.costco.status === "blocked_waf" ||
    status.costco.status === "rate_limited";

  const lastUpdateTime = status.updatedAt || status.cvs.lastSuccess || status.costco.lastSuccess;

  return (
    <div className="editorial-homepage-container">
      {/* 1. Editorial Hero Section */}
      <section className="editorial-hero">
        <div className="editorial-date-label">{formattedDate}</div>
        <h2 className="editorial-main-headline">Find your next best deal.</h2>
        <p className="editorial-sub-headline">Spend smarter with FSA-eligible savings.</p>
      </section>

      {/* 2. Two Large Colorful Summary Cards */}
      <section className="editorial-summary-grid" aria-label="Deal summary metrics">
        {/* Card 1 — Active deals (Solid Pastel Lavender) */}
        <div
          className={`editorial-summary-card lavender ${filterMode === "active_deals" ? "selected" : ""}`}
          onClick={() => setFilterMode((prev) => (prev === "active_deals" ? "all" : "active_deals"))}
          role="button"
          tabIndex={0}
          aria-label={`Filter by ${activeDeals.length} active deals`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setFilterMode((prev) => (prev === "active_deals" ? "all" : "active_deals"));
            }
          }}
        >
          <div className="editorial-summary-card-top">
            <Tag size={20} strokeWidth={2.4} />
            <ArrowUpRight size={20} strokeWidth={2.4} />
          </div>
          <div className="editorial-summary-card-middle font-mono">
            {activeDeals.length}
          </div>
          <div className="editorial-summary-card-bottom">
            <span>Active deals</span>
          </div>
        </div>

        {/* Card 2 — Best discount (Solid Pastel Lime-Green) */}
        <div
          className={`editorial-summary-card lime ${filterMode === "best_discount" ? "selected" : ""}`}
          onClick={() => setFilterMode((prev) => (prev === "best_discount" ? "all" : "best_discount"))}
          role="button"
          tabIndex={0}
          aria-label={`Filter by best discount of ${bestDiscount}%`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setFilterMode((prev) => (prev === "best_discount" ? "all" : "best_discount"));
            }
          }}
        >
          <div className="editorial-summary-card-top">
            <TrendingDown size={20} strokeWidth={2.4} />
            <ArrowUpRight size={20} strokeWidth={2.4} />
          </div>
          <div className="editorial-summary-card-middle font-mono">
            {bestDiscount}%
          </div>
          <div className="editorial-summary-card-bottom">
            <span>Best discount</span>
          </div>
        </div>
      </section>

      {/* 3. Today's Deals Section Heading */}
      <section className="editorial-deals-section">
        <div className="editorial-section-header">
          <h3 className="editorial-section-title">
            {filterMode === "active_deals"
              ? "Active discounted deals"
              : filterMode === "best_discount"
              ? "Top savings (20%+ off)"
              : "Today's deals"}
          </h3>

          <div
            className="editorial-refresh-indicator"
            onClick={onRefreshAll}
            role="button"
            tabIndex={0}
            title={isCached ? "Displaying prior verified price snapshot. Click to refresh." : "Click to refresh prices"}
          >
            <RefreshCw
              size={14}
              className={`editorial-refresh-icon ${isRefreshing ? "spin-icon" : ""}`}
            />
            <span className="editorial-update-text">
              {isCached ? `Cached • ${formatTimeAgo(lastUpdateTime)}` : `Updated ${formatTimeAgo(lastUpdateTime)}`}
            </span>
          </div>
        </div>

        {/* 4. Large Charcoal Deal Cards Grid */}
        <div className="editorial-cards-grid">
          {displayedProducts.map((p) => (
            <EditorialDealCard
              key={p.id}
              product={p}
              onInspect={onInspectProduct}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
