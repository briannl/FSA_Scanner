import React, { useEffect } from "react";
import { ProductObservation, PricePoint } from "../types/product";
import {
  X,
  ExternalLink,
  Tag,
  TrendingDown,
  Award,
  Clock,
  Layers,
  CheckCircle2,
  Package,
  Activity,
  HeartPulse,
  Sun,
  Eye,
  Bandage
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  isDarkMode?: boolean;
}

const renderDrawerCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("diag") || cat.includes("blood") || cat.includes("pressure")) return <Activity size={24} />;
  if (cat.includes("first aid") || cat.includes("wound") || cat.includes("bandage")) return <Bandage size={24} />;
  if (cat.includes("sun")) return <Sun size={24} />;
  if (cat.includes("vision") || cat.includes("eye")) return <Eye size={24} />;
  if (cat.includes("otc") || cat.includes("med")) return <HeartPulse size={24} />;
  return <Package size={24} />;
};

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  history,
  onClose,
  isDarkMode = false
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

  // Format observation chart data
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
  const yDomainMin = Math.max(0, Math.floor(minPrice * 0.82));
  const yDomainMax = Math.ceil(maxPrice * 1.15);

  const isLowest =
    product.lowestHistoricalPrice !== null &&
    product.currentPrice !== null &&
    product.currentPrice <= product.lowestHistoricalPrice;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
            border: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`,
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.15)",
            fontSize: "0.775rem",
            color: isDarkMode ? "#f8fafc" : "#0f172a"
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "2px" }}>
            {label}
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }} className="font-mono">
            {data.price !== null ? `$${Number(data.price).toFixed(2)}` : "Uncertain"}
          </div>
          {data.promo && data.promo !== "None" && (
            <div style={{ color: "var(--primary)", marginTop: "2px", fontWeight: 500 }}>
              {data.promo}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-product-title"
    >
      <div className="drawer-content-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header Hero Banner */}
        <div className="drawer-top-banner">
          <div className="drawer-hero-info">
            <div className="drawer-product-large-img">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                renderDrawerCategoryIcon(product.category)
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                <span className={`retailer-pill ${product.retailer.toLowerCase()}`}>
                  {product.retailer}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {product.category}
                </span>
                {product.fsaEligible && (
                  <span className="fsa-check-badge">
                    <CheckCircle2 size={11} /> FSA
                  </span>
                )}
              </div>

              <h2
                id="drawer-product-title"
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "var(--text-main)"
                }}
              >
                {product.name}
              </h2>

              <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", marginTop: "2px" }}>
                SKU: <span className="font-mono">{product.id}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-icon-only"
            onClick={onClose}
            aria-label="Close slide-over inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-scroll-body">
          {/* Price Summary 4-Box Grid */}
          <div className="drawer-stats-grid">
            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Current Price</span>
              <span className="drawer-stat-value">
                {product.currentPrice !== null ? `$${product.currentPrice.toFixed(2)}` : "Uncertain"}
              </span>
              {product.regularPrice && product.regularPrice > (product.currentPrice || 0) && (
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", textDecoration: "line-through" }} className="font-mono">
                  Reg ${product.regularPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Verified Savings</span>
              <span className="drawer-stat-value emerald">
                {product.discountPercent > 0 ? `-${product.discountPercent.toFixed(1)}%` : "0%"}
              </span>
              <span style={{ fontSize: "0.725rem", color: "var(--emerald)" }} className="font-mono">
                Save ${product.discountAmount.toFixed(2)}
              </span>
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">All-Time Low</span>
              <span className="drawer-stat-value" style={{ color: isLowest ? "var(--emerald)" : "var(--text-main)" }}>
                ${product.lowestHistoricalPrice?.toFixed(2) ?? "—"}
              </span>
              {isLowest && (
                <span style={{ fontSize: "0.725rem", color: "var(--emerald)", fontWeight: 600 }}>
                  <Award size={12} style={{ display: "inline" }} /> All-Time Low!
                </span>
              )}
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Last Observation</span>
              <span className="drawer-stat-value font-mono" style={{ fontSize: "0.95rem" }}>
                {product.observedAt ? product.observedAt.slice(0, 10) : "Today"}
              </span>
              <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                {product.sourceType}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Price History with Gradient Fill */}
          <div className="drawer-chart-card">
            <div className="drawer-chart-header">
              <div className="drawer-chart-title">
                <Clock size={15} style={{ color: "var(--primary)" }} />
                <span>Price Trend & Recorded Points</span>
              </div>
              <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                {chartData.length} observations
              </span>
            </div>

            <div style={{ height: 210, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }} />
                  <YAxis
                    domain={[yDomainMin, yDomainMax]}
                    tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {product.regularPrice && (
                    <ReferenceLine
                      y={product.regularPrice}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      label={{ value: "Regular", fill: "#94a3b8", fontSize: 9, position: "insideTopRight" }}
                    />
                  )}
                  {product.lowestHistoricalPrice && (
                    <ReferenceLine
                      y={product.lowestHistoricalPrice}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: "All-Time Low", fill: "#10b981", fontSize: 9, position: "insideBottomLeft" }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#0284c7"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                    dot={{ r: 3.5, fill: "#0284c7" }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Promotion & Restrictions Card */}
          <div
            style={{
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, fontSize: "0.85rem" }}>
              <Tag size={15} style={{ color: "var(--primary)" }} />
              <span>Deal Terms & Verification Details</span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem" }}>
              <Layers size={14} style={{ color: "var(--primary)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Promo Category:</strong> {product.promoType}
              </div>
            </div>

            {product.promoDetails ? (
              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", background: "var(--bg-surface)", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <strong>Offer Terms:</strong> {product.promoDetails}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Standard catalog markdown with no extra coupons or multi-buy quantity limits required.
              </div>
            )}

            {product.isRecentDrop && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.8rem",
                  color: "var(--amber)",
                  backgroundColor: "var(--amber-light)",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "var(--radius-md)"
                }}
              >
                <TrendingDown size={14} />
                <span>Price dropped recently below prior tracked observation.</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              <div>
                <strong>Package Size:</strong> {product.size || "Standard pack"}
              </div>
              <div>
                <strong>Unit Price:</strong> {product.unitPrice || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="drawer-action-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>

          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            <span>View on {product.retailer}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
