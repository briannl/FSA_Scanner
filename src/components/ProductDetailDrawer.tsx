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
import { formatSourceLabel } from "../utils/sourceTypeHelper";
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
  isMobile?: boolean;
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
  isDarkMode = true,
  isMobile = false
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

  // Custom Chart Tooltip with Lavender and Lime styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: isDarkMode ? "#12131a" : "#ffffff",
            border: `1px solid ${isDarkMode ? "var(--border-strong)" : "#cbc5df"}`,
            borderRadius: "14px",
            padding: "0.6rem 0.85rem",
            boxShadow: "var(--shadow-md)",
            fontSize: "0.8rem",
            color: isDarkMode ? "#f8fafc" : "#181426"
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
            {label}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", fontWeight: 700, color: "var(--lavender)" }}>
            ${data.price !== null ? data.price.toFixed(2) : "Uncertain"}
          </div>
          {data.promo && data.promo !== "None" && (
            <div style={{ fontSize: "0.725rem", color: "var(--lime)", marginTop: "4px", fontWeight: 600 }}>
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
      className={`drawer-overlay ${isMobile ? "mobile-sheet-overlay" : ""}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className={`drawer-content-sheet ${isMobile ? "mobile-bottom-sheet" : "desktop-side-panel"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        {isMobile && (
          <div className="bottom-sheet-handle-area">
            <div className="bottom-sheet-handle" />
          </div>
        )}

        {/* Top Product Banner */}
        <div className="drawer-top-banner">
          <div className="drawer-hero-info">
            <div className="drawer-product-large-img" title={product.category}>
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
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span className={`retailer-pill ${product.retailer.toLowerCase()}`}>
                  {product.retailer}
                </span>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                  {product.category}
                </span>
                <span className={`source-type-pill ${product.sourceType}`}>
                  {formatSourceLabel(product.sourceType)}
                </span>
                {product.fsaEligible && (
                  <span className="fsa-check-badge">
                    <CheckCircle2 size={11} /> FSA
                  </span>
                )}
              </div>
              <h2
                id="drawer-title"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "var(--text-main)"
                }}
              >
                {product.name}
              </h2>
              <div className="timestamp font-mono" style={{ fontSize: "0.725rem", color: "var(--text-subtle)", marginTop: "0.25rem" }}>
                SKU: {product.id}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-icon-only"
            onClick={onClose}
            aria-label="Close details"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="drawer-scroll-body">
          {/* 4-Box Key Stats Grid with Lavender and Lime Highlights */}
          <div className="drawer-stats-grid">
            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Current Price</span>
              <span className="drawer-stat-value font-mono">
                {product.currentPrice !== null ? `$${product.currentPrice.toFixed(2)}` : "Uncertain"}
              </span>
              {product.regularPrice && product.regularPrice > (product.currentPrice || 0) && (
                <span style={{ fontSize: "0.725rem", color: "var(--text-subtle)", textDecoration: "line-through", marginTop: "2px" }} className="font-mono">
                  Reg ${product.regularPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Verified Savings</span>
              <span className="drawer-stat-value lime font-mono">
                {product.discountPercent > 0 ? `-${product.discountPercent.toFixed(1)}%` : "0.0%"}
              </span>
              {product.discountAmount > 0 && (
                <span style={{ fontSize: "0.725rem", color: "var(--lime)", marginTop: "2px" }} className="font-mono">
                  Save ${product.discountAmount.toFixed(2)}
                </span>
              )}
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">All-Time Low</span>
              <span className="drawer-stat-value font-mono">
                {product.lowestHistoricalPrice !== null ? `$${product.lowestHistoricalPrice.toFixed(2)}` : "N/A"}
              </span>
              {isLowest && (
                <span className="badge-alltime-low" style={{ marginTop: "4px", width: "fit-content" }}>
                  <Award size={11} /> All-Time Low
                </span>
              )}
            </div>

            <div className="drawer-stat-box">
              <span className="drawer-stat-label">Last Observation</span>
              <span className="drawer-stat-value font-mono" style={{ fontSize: "0.95rem" }}>
                {product.observedAt ? product.observedAt.slice(0, 10) : "Today"}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {formatSourceLabel(product.sourceType)}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Price History Chart */}
          <div className="drawer-chart-card">
            <div className="drawer-chart-header">
              <div className="drawer-chart-title">
                <Clock size={16} style={{ color: "var(--lavender)" }} />
                <span>Price Trend & Recorded Points</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {chartData.length} {chartData.length === 1 ? "observation" : "observations"}
              </span>
            </div>

            <div style={{ width: "100%", height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradientLavender" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDarkMode ? "#a78bfa" : "#7c3aed"} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={isDarkMode ? "#a78bfa" : "#7c3aed"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-subtle)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-subtle)" }}
                  />
                  <YAxis
                    stroke="var(--text-subtle)"
                    fontSize={11}
                    domain={[yDomainMin, yDomainMax]}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-subtle)" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {product.regularPrice && (
                    <ReferenceLine
                      y={product.regularPrice}
                      stroke={isDarkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                      strokeDasharray="4 4"
                      label={{
                        value: "Regular",
                        fill: "var(--text-subtle)",
                        fontSize: 10,
                        position: "right"
                      }}
                    />
                  )}
                  {product.lowestHistoricalPrice && (
                    <ReferenceLine
                      y={product.lowestHistoricalPrice}
                      stroke="var(--lime)"
                      strokeDasharray="2 2"
                      label={{
                        value: "All-Time Low",
                        fill: "var(--lime)",
                        fontSize: 10,
                        position: "left"
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isDarkMode ? "#a78bfa" : "#7c3aed"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#priceGradientLavender)"
                    dot={{ r: 4, fill: isDarkMode ? "#a78bfa" : "#7c3aed", strokeWidth: 2, stroke: isDarkMode ? "#090a0f" : "#ffffff" }}
                    activeDot={{ r: 6, fill: "var(--lime)", stroke: isDarkMode ? "#090a0f" : "#ffffff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deal Conditions & Rules Container */}
          <div className="drawer-chart-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
              <Tag size={16} style={{ color: "var(--lavender)" }} />
              <span>Deal Terms & Verification Details</span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem" }}>
              <Layers size={14} style={{ color: "var(--lavender)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Promo Category:</strong> {product.promoType}
              </div>
            </div>

            {product.promoDetails ? (
              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
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
                  padding: "0.45rem 0.75rem",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--amber-border)"
                }}
              >
                <TrendingDown size={14} />
                <span>Price dropped recently below prior tracked observation.</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "0.25rem", flexWrap: "wrap" }}>
              <div>
                <strong>Package Size:</strong> {product.size || "Standard pack"}
              </div>
              <div>
                <strong>Unit Price:</strong> {product.unitPrice || "N/A"}
              </div>
            </div>
          </div>

          {/* FSAFEDS Official Eligibility & Evidence Details */}
          <div className="drawer-chart-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
              <CheckCircle2 size={16} style={{ color: "var(--lime)" }} />
              <span>FSAFEDS Eligibility & Verification Evidence</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem", fontSize: "0.8rem" }}>
              <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>FSAFEDS Category</div>
                <div style={{ fontWeight: 700, color: "var(--lavender)", marginTop: "0.15rem" }}>
                  {product.fsafedsCategory || product.category}
                </div>
              </div>

              <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Documentation</div>
                <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "0.15rem" }}>
                  {product.documentationRequirement || "None (OTC Item per CARES Act)"}
                </div>
              </div>

              <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Account Types</div>
                <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "0.15rem" }}>
                  HCFSA, HSA, FSA
                </div>
              </div>

              <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Review Status</div>
                <div style={{ fontWeight: 700, color: "var(--lime)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <CheckCircle2 size={12} /> {product.eligibilityReviewStatus ? product.eligibilityReviewStatus.toUpperCase() : "VERIFIED"}
                </div>
              </div>
            </div>

            {/* Evidence Note & Link */}
            <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ marginBottom: "0.35rem" }}>
                <strong>Evidence:</strong> {product.eligibilityEvidenceNote || `Verified explicit FSA/HSA attribute on ${product.retailer} catalog.`}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}>
                <ExternalLink size={12} style={{ color: "var(--lavender)" }} />
                <a
                  href={product.eligibilityEvidenceUrl || "https://www.fsafeds.gov/explore/hcfsa/expenses"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--lavender)", textDecoration: "none" }}
                >
                  View FSAFEDS Health Care FSA Eligible Expenses Reference
                </a>
              </div>
            </div>

            {/* Identifiers */}
            {(product.upc || product.asin || product.sku) && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.725rem", color: "var(--text-subtle)" }}>
                {product.upc && <span className="font-mono">UPC: {product.upc}</span>}
                {product.asin && <span className="font-mono">ASIN: {product.asin}</span>}
                {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions with Pill-Shaped Buttons */}
        <div className="drawer-action-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ borderRadius: "var(--radius-pill)" }}>
            Close
          </button>

          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none", borderRadius: "var(--radius-pill)" }}
          >
            <span>View on {product.retailer}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
