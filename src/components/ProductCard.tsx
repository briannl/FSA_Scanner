import React from "react";
import { ProductObservation } from "../types/product";
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Package,
  Activity,
  HeartPulse,
  Sun,
  Eye,
  Bandage
} from "lucide-react";

interface ProductCardProps {
  product: ProductObservation;
  isSaved: boolean;
  onToggleSave: (product: ProductObservation) => void;
  onSelectProduct: (product: ProductObservation) => void;
}

const renderCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("diag") || cat.includes("blood") || cat.includes("pressure") || cat.includes("monitor")) {
    return <Activity size={20} />;
  }
  if (cat.includes("first aid") || cat.includes("wound") || cat.includes("bandage")) {
    return <Bandage size={20} />;
  }
  if (cat.includes("sun") || cat.includes("skin")) {
    return <Sun size={20} />;
  }
  if (cat.includes("vision") || cat.includes("eye")) {
    return <Eye size={20} />;
  }
  if (cat.includes("otc") || cat.includes("med") || cat.includes("cold") || cat.includes("pain") || cat.includes("allergy")) {
    return <HeartPulse size={20} />;
  }
  return <Package size={20} />;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSaved,
  onToggleSave,
  onSelectProduct
}) => {
  const hasDiscount = product.discountPercent > 0;
  const isDrop = product.isRecentDrop;

  return (
    <article
      className="minimal-product-card"
      onClick={() => onSelectProduct(product)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectProduct(product);
        }
      }}
    >
      <div className="minimal-card-main">
        {/* Product Thumbnail / Icon */}
        <div className="minimal-card-thumb" aria-hidden="true">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="minimal-card-img"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="minimal-card-icon-wrap">
              {renderCategoryIcon(product.category)}
            </div>
          )}
        </div>

        {/* Product Body Information */}
        <div className="minimal-card-body">
          {/* Top Line: Retailer + FSA Verification Indicator */}
          <div className="minimal-card-meta">
            <span className="minimal-card-retailer">{product.retailer}</span>
            <span className="minimal-meta-dot">•</span>
            <span className="minimal-fsa-verified">
              <CheckCircle2 size={12} className="fsa-check-icon" />
              <span>FSA Verified</span>
            </span>
            {isDrop && (
              <>
                <span className="minimal-meta-dot">•</span>
                <span className="minimal-drop-tag">Price Drop</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="minimal-card-title" title={product.name}>
            {product.name}
          </h3>

          {/* Pricing Row: Tabular Nums */}
          <div className="minimal-card-pricing">
            <div className="minimal-price-cluster">
              <span className={`minimal-price-current font-mono ${hasDiscount ? "text-lime" : ""}`}>
                {product.currentPrice !== null ? `$${product.currentPrice.toFixed(2)}` : "—"}
              </span>

              {product.regularPrice && product.regularPrice > (product.currentPrice || 0) && (
                <span className="minimal-price-original font-mono">
                  ${product.regularPrice.toFixed(2)}
                </span>
              )}

              {hasDiscount && (
                <span className="minimal-discount-pill font-mono">
                  Save {Math.round(product.discountPercent)}%
                </span>
              )}
            </div>

            {product.unitPrice && (
              <span className="minimal-unit-price font-mono">
                {product.unitPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Row: Save + View Deal */}
      <div className="minimal-card-footer">
        <button
          type="button"
          className={`minimal-save-btn ${isSaved ? "saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product);
          }}
          aria-label={isSaved ? "Remove from saved deals" : "Save this deal"}
          title={isSaved ? "Remove from saved" : "Save deal"}
        >
          <Bookmark
            size={16}
            fill={isSaved ? "var(--lavender)" : "none"}
            stroke={isSaved ? "var(--lavender)" : "currentColor"}
          />
          <span className="minimal-action-text">{isSaved ? "Saved" : "Save"}</span>
        </button>

        <div className="minimal-footer-right">
          <button
            type="button"
            className="minimal-inspect-link"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
          >
            Inspect
          </button>

          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="minimal-view-deal-btn"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View deal at ${product.retailer}`}
          >
            <span>View Deal</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
};
