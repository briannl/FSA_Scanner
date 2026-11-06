import React from "react";
import { GroupedProduct } from "../services/productMatcher";
import { RETAILER_REGISTRY } from "../types/product";
import {
  X,
  ExternalLink,
  Store,
  Truck,
  Globe,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock
} from "lucide-react";

interface CompareOffersModalProps {
  product: GroupedProduct | null;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const CompareOffersModal: React.FC<CompareOffersModalProps> = ({
  product,
  onClose
}) => {
  if (!product) return null;

  const renderChannelIcon = (channel: string) => {
    switch (channel) {
      case "In-Store":
        return <Store size={13} />;
      case "Delivery":
        return <Truck size={13} />;
      case "Online":
      default:
        return <Globe size={13} />;
    }
  };

  return (
    <div className="drawer-overlay compare-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="compare-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl, 24px)",
          maxWidth: "780px",
          width: "92%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem"
          }}
        >
          <div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.45rem", flexWrap: "wrap" }}>
              <span className="badge badge-lavender" style={{ borderRadius: "var(--radius-pill)" }}>
                {product.category}
              </span>
              <span className="badge badge-subtle font-mono" style={{ borderRadius: "var(--radius-pill)" }}>
                {product.offers.length} Store Offers
              </span>
              {product.upc && (
                <span className="badge badge-subtle font-mono" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.7rem" }}>
                  UPC: {product.upc}
                </span>
              )}
              {product.asin && (
                <span className="badge badge-subtle font-mono" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.7rem" }}>
                  ASIN: {product.asin}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
              {product.name}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Brand: <strong>{product.brand}</strong> • Documentation: {product.documentationRequirement}
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{ borderRadius: "var(--radius-pill)", flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Different Pack Sizes Warning */}
          {product.hasDifferentPackSizes && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8rem",
                padding: "0.65rem 0.95rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--amber-light)",
                border: "1px solid var(--amber-border)",
                color: "var(--amber)"
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Different Package Sizes:</strong> Retailers offer varying quantities. Compare <strong>Unit Price</strong> for true value.
              </span>
            </div>
          )}

          {/* Savings Highlight */}
          {product.maxSavingsPercent > 0 && product.bestRetailer && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(190, 242, 100, 0.08) 0%, rgba(167, 139, 250, 0.08) 100%)",
                border: "1px solid rgba(190, 242, 100, 0.3)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--lime)" }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Best Price at {product.bestRetailer}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Save up to {product.maxSavingsPercent}% compared to highest store price
                  </div>
                </div>
              </div>
              <div className="font-mono text-lime" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                ${product.lowestPrice?.toFixed(2)}
              </div>
            </div>
          )}

          {/* Store Offers Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Verified Multi-Store Offers
            </div>

            {product.offers.map((offer) => {
              const reg = RETAILER_REGISTRY[offer.retailer];
              return (
                <div
                  key={offer.id}
                  title={`${offer.retailer}: ${reg?.description || ""}`}
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: offer.isBestOffer ? "1.5px solid var(--lime)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1rem 1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                    transition: "all var(--trans-fast)"
                  }}
                >
                  {/* Retailer Info */}
                  <div style={{ minWidth: "160px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                        {offer.retailer}
                      </span>
                      {offer.isBestOffer && (
                        <span className="badge badge-lime font-sans" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}>
                          Best Price
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        className="badge badge-subtle font-sans"
                        style={{ borderRadius: "var(--radius-pill)", fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        {renderChannelIcon(offer.channel)}
                        {offer.channel}
                      </span>

                      {offer.membershipRequired && (
                        <span className="badge badge-lavender font-sans" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}>
                          {offer.membershipRequired}
                        </span>
                      )}

                      {offer.isPriceStale && (
                        <span
                          className="badge font-sans"
                          style={{
                            borderRadius: "var(--radius-pill)",
                            fontSize: "0.68rem",
                            backgroundColor: "var(--amber-light)",
                            color: "var(--amber)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem"
                          }}
                        >
                          <Clock size={10} /> Stale Price (&gt;48h)
                        </span>
                      )}
                    </div>

                    {offer.promoDetails && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                        {offer.promoDetails}
                      </div>
                    )}
                  </div>

                  {/* Pricing & Unit Price */}
                  <div style={{ textAlign: "right", minWidth: "110px" }}>
                    <div className="font-mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: offer.isBestOffer ? "var(--lime)" : "var(--text-main)" }}>
                      ${offer.currentPrice ? offer.currentPrice.toFixed(2) : "—"}
                    </div>

                    {offer.regularPrice && offer.currentPrice && offer.regularPrice > offer.currentPrice && (
                      <div className="font-mono" style={{ fontSize: "0.8rem", color: "var(--text-subtle)", textDecoration: "line-through" }}>
                        ${offer.regularPrice.toFixed(2)}
                      </div>
                    )}

                    {offer.unitPrice && (
                      <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        {offer.unitPrice}
                      </div>
                    )}
                  </div>

                  {/* Direct Store Link */}
                  <div>
                    <a
                      href={offer.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary font-sans"
                      style={{
                        borderRadius: "var(--radius-pill)",
                        padding: "0.45rem 0.95rem",
                        fontSize: "0.8rem",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span>Buy</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verified Evidence Footer */}
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <ShieldCheck size={16} style={{ color: "var(--lavender)", flexShrink: 0 }} />
            <div>
              <strong>Strict Eligibility Citation:</strong> Eligible under IRS Section 213(d) and CARES Act Section 3702. Verified against{" "}
              <a href={product.evidenceSourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--lavender)" }}>
                FSAFEDS Reference Database
              </a>.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={onClose}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
