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
  if (cat.includes("diag") || cat.includes("blood") || cat.includes("pressure")) return <Activity size={20} />;
  if (cat.includes("first aid") || cat.includes("wound") || cat.includes("bandage")) return <Bandage size={20} />;
  if (cat.includes("sun")) return <Sun size={20} />;
  if (cat.includes("vision") || cat.includes("eye")) return <Eye size={20} />;
  if (cat.includes("otc") || cat.includes("med")) return <HeartPulse size={20} />;
  return <Package size={20} />;
};

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  products,
  onSelectProduct
}) => {
  if (products.length === 0) {
    return (
      <div className="mobile-empty-state">
        <Package size={40} style={{ margin: "0 auto 0.75rem auto", opacity: 0.5, color: "var(--lavender)" }} />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>No matching products</h3>
        <p style={{ fontSize: "0.85rem", marginTop: "0.35rem", color: "var(--text-muted)" }}>
          Try clearing your search query or loosening active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="toolbar-container mobile-cards-wrapper" style={{ paddingTop: 0 }}>
      <div className="mobile-cards-grid">
        {products.map((item) => {
          const isLowest =
            item.lowestHistoricalPrice !== null &&
            item.currentPrice !== null &&
            item.currentPrice <= item.lowestHistoricalPrice;

          return (
            <article
              key={item.id}
              className="product-mobile-card"
              onClick={() => onSelectProduct(item)}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${item.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectProduct(item);
                }
              }}
            >
              {/* Card Header: Thumbnail + Retailer & Chips + 2-Line Clamped Title */}
              <div className="mobile-card-top">
                <div className="product-thumb-box mobile-thumb" title={item.category}>
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
                    {item.fsaEligible && (
                      <span className="fsa-check-badge">
                        <CheckCircle2 size={11} /> FSA
                      </span>
                    )}
                    <span className={`source-type-pill ${item.sourceType}`}>
                      {formatSourceLabel(item.sourceType)}
                    </span>
                  </div>

                  <h3 className="mobile-product-title" title={item.name}>
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Deal Signals & Conditions Bar */}
              <div className="mobile-card-signals">
                <span className={`promo-semantic-badge ${item.promoType === "Costco Instant Savings" ? "instant" : item.promoType === "Standard Markdown" ? "markdown" : item.promoType === "CVS Promo" ? "cvs" : item.promoType === "Multi-Buy" ? "multibuy" : item.promoType === "Coupon Only" ? "coupon" : "none"}`}>
                  {item.promoType}
                </span>

                {item.isRecentDrop && (
                  <span className="badge-recent-drop">
                    <TrendingDown size={11} /> Price Drop
                  </span>
                )}

                {isLowest && (
                  <span className="badge-alltime-low">
                    <Award size={11} /> All-Time Low
                  </span>
                )}

                {item.promoDetails && (
                  <div className="mobile-promo-details">
                    {item.promoDetails}
                  </div>
                )}
              </div>

              {/* Pricing & Interactive Pill CTAs */}
              <div className="mobile-card-pricing-row">
                <div className="mobile-pricing-left">
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", flexWrap: "wrap" }}>
                    <span className="price-current-bold mobile-price">
                      {item.currentPrice !== null ? `$${item.currentPrice.toFixed(2)}` : "Uncertain"}
                    </span>
                    {item.regularPrice && item.regularPrice > (item.currentPrice || 0) && (
                      <span className="price-regular-strike">
                        ${item.regularPrice.toFixed(2)}
                      </span>
                    )}
                    {item.discountPercent > 0 && (
                      <span className="savings-badge-pill lime-highlight">
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
                    className="btn btn-secondary mobile-action-btn pill-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(item);
                    }}
                    aria-label={`Inspect price history for ${item.name}`}
                  >
                    <LineChart size={15} />
                    <span>Inspect</span>
                  </button>

                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mobile-action-btn pill-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Buy ${item.name} at ${item.retailer}`}
                  >
                    <span>Buy</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
