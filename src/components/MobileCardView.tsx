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
              {/* Top Row: Thumbnail + Title + Retailer Badge */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <span className={`retailer-pill ${item.retailer.toLowerCase()}`}>
                      {item.retailer}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {item.category}
                    </span>
                    <span className={`source-type-pill ${item.sourceType}`}>
                      {formatSourceLabel(item.sourceType)}
                    </span>
                    {item.fsaEligible && (
                      <span className="fsa-check-badge" style={{ marginLeft: "auto" }}>
                        <CheckCircle2 size={11} /> FSA
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--text-main)"
                    }}
                  >
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Signals and Promo Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
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
                  <span style={{ color: "var(--text-muted)", fontSize: "0.725rem", width: "100%", marginTop: "2px" }}>
                    {item.promoDetails}
                  </span>
                )}
              </div>

              {/* Pricing & Quick CTAs */}
              <div className="mobile-card-pricing-row">
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span className="price-current-bold" style={{ fontSize: "1.1rem" }}>
                      {item.currentPrice !== null ? `$${item.currentPrice.toFixed(2)}` : "Uncertain"}
                    </span>
                    {item.regularPrice && item.regularPrice > (item.currentPrice || 0) && (
                      <span className="price-regular-strike">
                        ${item.regularPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.unitPrice && (
                    <div className="price-unit-subline">{item.unitPrice}</div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {item.discountPercent > 0 && (
                    <span className="savings-badge-pill" style={{ fontSize: "0.85rem", padding: "0.2rem 0.5rem" }}>
                      -{item.discountPercent.toFixed(1)}%
                    </span>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(item);
                    }}
                  >
                    <LineChart size={13} />
                    <span>History</span>
                  </button>

                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    onClick={(e) => e.stopPropagation()}
                  >
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
