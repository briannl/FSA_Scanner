import React, { useEffect } from "react";
import { ProductObservation, PricePoint } from "../types/product";
import {
  X,
  ExternalLink,
  Tag,
  TrendingDown,
  Award,
  AlertCircle,
  Clock,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

interface ProductDetailDrawerProps {
  product: ProductObservation | null;
  history: PricePoint[];
  onClose: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  history,
  onClose
}) => {
  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  // Prepare chart data
  const chartData = (history && history.length > 0 ? history : [
    { date: "Current", price: product.currentPrice, priceStatus: product.priceStatus }
  ]).map((pt) => ({
    date: pt.date.includes("T") ? pt.date.slice(0, 10) : pt.date,
    price: pt.price,
    status: pt.priceStatus,
    promo: pt.promoType || "None",
    details: pt.promoDetails || ""
  }));

  const validPrices = chartData
    .map((d) => d.price)
    .filter((p): p is number => p !== null && p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 100;
  const yDomainMin = Math.max(0, Math.floor(minPrice * 0.85));
  const yDomainMax = Math.ceil(maxPrice * 1.15);

  const isLowest =
    product.lowestHistoricalPrice !== null &&
    product.currentPrice !== null &&
    product.currentPrice <= product.lowestHistoricalPrice;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span className={`retailer-pill ${product.retailer.toLowerCase()}`}>
                {product.retailer}
              </span>
              <span className="product-category-tag">{product.category}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                SKU: {product.id}
              </span>
            </div>
            <h2 id="drawer-title" style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.35 }}>
              {product.name}
            </h2>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Close details"
            style={{ padding: "0.3rem", borderRadius: "50%" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Price Overview Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              background: "var(--bg-subtle)",
              padding: "0.85rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)"
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Current Price
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                {product.currentPrice !== null ? `$${product.currentPrice.toFixed(2)}` : "Uncertain"}
              </div>
              {product.regularPrice && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                  Reg: ${product.regularPrice.toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Savings
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>
                {product.discountPercent > 0 ? `-${product.discountPercent.toFixed(1)}%` : "0%"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                Save ${product.discountAmount.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                All-Time Low
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: isLowest ? "var(--success)" : "var(--text-main)" }}>
                ${product.lowestHistoricalPrice?.toFixed(2) ?? "—"}
              </div>
              {isLowest && (
                <div style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 600 }}>
                  <Award size={12} style={{ display: "inline" }} /> Best Deal!
                </div>
              )}
            </div>
          </div>

          {/* Historical Price Chart */}
          <div className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Clock size={16} /> Price History (Past Observations)
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {chartData.length} records logged
              </span>
            </div>

            <div style={{ height: 220, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[yDomainMin, yDomainMax]} tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Price"]}
                    labelFormatter={(label) => `Observed: ${label}`}
                  />
                  {product.lowestHistoricalPrice && (
                    <ReferenceLine
                      y={product.lowestHistoricalPrice}
                      stroke="#16a34a"
                      strokeDasharray="4 4"
                      label={{ value: "All-Time Low", fill: "#16a34a", fontSize: 10, position: "insideBottomLeft" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#0284c7" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Promotion & Deal Breakdown */}
          <div className="promo-breakdown-card">
            <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
              <Tag size={16} /> Deal Terms & Restrictions
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <Layers size={15} style={{ color: "var(--primary)", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong>Promotion Category:</strong> {product.promoType}
                </div>
              </div>

              {product.promoDetails ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <AlertCircle size={15} style={{ color: "var(--warning)", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong>Offer Conditions / Quantity Limits:</strong>
                    <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                      {product.promoDetails}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)" }}>
                  No special coupons or multi-buy requirements. Standard markdown price.
                </div>
              )}

              {product.isRecentDrop && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#854d0e", background: "#fef9c3", padding: "0.4rem 0.6rem", borderRadius: "4px" }}>
                  <TrendingDown size={14} />
                  <span><strong>Recent Price Drop:</strong> Price has recently fallen below previous observation.</span>
                </div>
              )}
            </div>
          </div>

          {/* Unit Price & Package Size */}
          <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", gap: "1.5rem" }}>
            <div>
              <strong>Package Size:</strong> {product.size || "Standard"}
            </div>
            <div>
              <strong>Calculated Unit Price:</strong> {product.unitPrice || "N/A"}
            </div>
            <div>
              <strong>Source:</strong> {product.sourceType}
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            <ExternalLink size={16} />
            Buy on {product.retailer}
          </a>
        </div>
      </div>
    </div>
  );
};
