import React from "react";
import { ProductObservation } from "../types/product";
import { ProductCard } from "./ProductCard";
import { Package } from "lucide-react";

interface MobileCardViewProps {
  products: ProductObservation[];
  onSelectProduct: (product: ProductObservation) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (product: ProductObservation) => void;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  products,
  onSelectProduct,
  isSaved = () => false,
  onToggleSave = () => {}
}) => {
  if (products.length === 0) {
    return (
      <div className="mobile-empty-state">
        <Package size={36} style={{ margin: "0 auto 0.75rem auto", opacity: 0.4, color: "var(--lavender)" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>No matching deals found</h3>
        <p style={{ fontSize: "0.825rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>
          Try clearing filters or adjusting your search term.
        </p>
      </div>
    );
  }

  return (
    <div className="mobile-cards-wrapper">
      <div className="mobile-cards-grid">
        {products.map((item) => (
          <ProductCard
            key={item.id}
            product={item}
            isSaved={isSaved(item.id)}
            onToggleSave={onToggleSave}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};
