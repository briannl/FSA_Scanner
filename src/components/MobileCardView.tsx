import React from "react";
import { ProductObservation } from "../types/product";
import {
  ExternalLink,
  LineChart,
  TrendingDown,
  Award,
  CheckCircle2,
  Package,
  Activity,
  HeartPulse,
  Sun,
  Eye,
  Bandage
} from "lucide-react";
import { formatSourceLabel } from "../utils/sourceTypeHelper";

interface MobileCardViewProps {
  products: ProductObservation[];
  onSelectProduct: (product: ProductObservation) => void;
}

const renderCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("diag") || cat.includes("blood") || cat.includes("pressure")) return <Activity size={18} />;
  if (cat.includes("first aid") || cat.includes("wound") || cat.includes("bandage")) return <Bandage size={18} />;
  if (cat.includes("sun")) return <Sun size={18} />;
  if (cat.includes("vision") || cat.includes("eye")) return <Eye size={18} />;
  if (cat.includes("otc") || cat.includes("med")) return <HeartPulse size={18} />;
  return <Package size={18} />;
};

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  products,
  onSelectProduct
}) => {
  if (products.length === 0) {
    return (
      <div
        style={{
          padding: "3rem 1rem",
          textAlign: "center",
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          margin: "1rem"
        }}
      >
        <Package size={36} style={{ margin: "0 auto 0.75rem auto", opacity: 0.5 }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-main)" }}>No matching products</h3>
        <p style={{ fontSize: "0.825rem", marginTop: "0.25rem" }}>
          Try clearing your search query or loosening active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="toolbar-container" style={{ paddingTop: 0 }}>
      <div className="mobile-cards-grid">
        {products.map((item) => {
          const isLowest =
            item.lowestHistoricalPrice !== null &&
            item.currentPrice !== null &&
            item.currentPrice <= item.lowestHistoricalPrice;

          return (
            <div
              key={item.id}
              className="product-mobile-card"
              onClick={() => onSelectProduct(item)}
              role="button"
              tabIndex={0}
            >
              {/* Top Row: Thumbnail + Info */}
              <div className="mobile-card-top">
                <div className="product-thumb-box" style={{ width: 48, height: 48 }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="product-thumb-img"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    renderCategoryIcon(item.category)
                  )}
                </div>

                <div className="mobile-card-info">
                  <div className="mobile-card-tags">
                    <span className={`retailer-pill ${item.retailer.toLowerCase()}`}>
                      {item.retailer}
                    </span>
                    <span className="mobile-category-tag">
                      {item.category}
                    </span>
                    <span className={`source-type-pill ${item.sourceType}`}>
                      {formatSourceLabel(item.sourceType)}
                    </span>
                    {item.fsaEligible && (
                      <span className="fsa-check-badge">
                        <CheckCircle2 size={11} /> FSA
                      </span>
                    )}
                  </div>

                  <h3 className="mobile-product-title" title={item.name}>
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Signals and Promo Details */}
              <div className="mobile-card-signals">
                <span className={`promo-semantic-badge ${item.promoType === "Costco Instant Savings" ? "instant" : item.promoType === "Standard Markdown" ? "markdown" : item.promoType === "CVS Promo" ? "cvs" : item.promoType === "Multi-Buy" ? "multibuy" : item.promoType === "Coupon Only" ? "coupon" : "none"}`}>
                  {item.promoType}
                </span>

                {item.isRecentDrop && (
                  <span className="badge-recent-drop">
                    <TrendingDown size={11} /> Drop
                  </span>
                )}

                {isLowest && (
                  <span className="badge-alltime-low">
                    <Award size={11} /> All-Time Low
                  </span>
                )}

                {item.promoDetails && (
                  <span className="mobile-promo-details">
                    {item.promoDetails}
                  </span>
                )}
              </div>

              {/* Pricing & Quick CTAs */}
              <div className="mobile-card-pricing-row">
                <div className="mobile-pricing-left">
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span className="price-current-bold" style={{ fontSize: "1.15rem" }}>
                      {item.currentPrice !== null ? `$${item.currentPrice.toFixed(2)}` : "Uncertain"}
                    </span>
                    {item.regularPrice && item.regularPrice > (item.currentPrice || 0) && (
                      <span className="price-regular-strike">
                        ${item.regularPrice.toFixed(2)}
                      </span>
                    )}
                    {item.discountPercent > 0 && (
                      <span className="savings-badge-pill">
                        -{item.discountPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {item.unitPrice && (
                    <div className="price-unit-subline">{item.unitPrice}</div>
                  )}
                </div>

                <div className="mobile-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary mobile-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(item);
                    }}
                    aria-label={`Inspect ${item.name}`}
                  >
                    <LineChart size={14} />
                    <span>Inspect</span>
                  </button>

                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mobile-action-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Buy ${item.name}`}
                  >
                    <span>Buy</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
