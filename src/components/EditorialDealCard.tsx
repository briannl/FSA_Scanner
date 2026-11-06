import React from "react";
import { ProductObservation } from "../types/product";
import { ArrowUpRight } from "lucide-react";

interface EditorialDealCardProps {
  product: ProductObservation;
  onInspect: (product: ProductObservation) => void;
}

export const EditorialDealCard: React.FC<EditorialDealCardProps> = ({
  product,
  onInspect
}) => {
  const hasVerifiedDiscount =
    product.discountPercent > 0 &&
    product.regularPrice !== null &&
    product.currentPrice !== null &&
    product.regularPrice > product.currentPrice;

  return (
    <article
      className="editorial-deal-card"
      onClick={() => onInspect(product)}
      role="button"
      tabIndex={0}
      aria-label={`View deal details for ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspect(product);
        }
      }}
    >
      {/* Top Meta Row: Retailer Badge + FSA Label + Discount Badge */}
      <div className="editorial-card-top">
        <div className="editorial-card-meta-left">
          <span className="editorial-retailer-badge">{product.retailer}</span>
          <span className="editorial-fsa-label">FSA eligible</span>
        </div>

        {hasVerifiedDiscount && (
          <div className="editorial-discount-badge font-mono">
            {Math.round(product.discountPercent)}% OFF
          </div>
        )}
      </div>

      {/* Middle: Prominent Product Title */}
      <h3 className="editorial-card-title">{product.name}</h3>

      {/* Bottom: Pricing + Inspect CTA */}
      <div className="editorial-card-bottom">
        <div className="editorial-card-pricing">
          <span className="editorial-price-current font-mono">
            {product.currentPrice !== null ? `$${product.currentPrice.toFixed(2)}` : "—"}
          </span>

          {hasVerifiedDiscount && product.regularPrice && (
            <span className="editorial-price-regular font-mono">
              ${product.regularPrice.toFixed(2)}
            </span>
          )}
        </div>

        <button
          type="button"
          className="editorial-inspect-btn font-sans"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(product);
          }}
          aria-label={`Inspect ${product.name}`}
        >
          <span>Inspect</span>
          <ArrowUpRight size={15} strokeWidth={2.4} />
        </button>
      </div>
    </article>
  );
};
