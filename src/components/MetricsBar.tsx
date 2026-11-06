import React from "react";
import { ProductObservation } from "../types/product";
import { Tag, TrendingDown, Sparkles, Box } from "lucide-react";

interface MetricsBarProps {
  products: ProductObservation[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ products }) => {
  const deals = products.filter(p => (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed");
  const recentDrops = products.filter(p => p.isRecentDrop);
  const avgDiscount = deals.length > 0
    ? (deals.reduce((sum, p) => sum + p.discountPercent, 0) / deals.length).toFixed(1)
    : "0.0";
  const maxSavings = deals.length > 0
    ? Math.max(...deals.map(p => p.discountAmount)).toFixed(2)
    : "0.00";

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon-box deals">
          <Tag size={20} />
        </div>
        <div>
          <div className="metric-value">{deals.length}</div>
          <div className="metric-label">Active Verified Deals</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box savings">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="metric-value">{avgDiscount}%</div>
          <div className="metric-label">Avg Deal Discount (Up to ${maxSavings})</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box drops">
          <TrendingDown size={20} />
        </div>
        <div>
          <div className="metric-value">{recentDrops.length}</div>
          <div className="metric-label">Recent Price Drops</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box total">
          <Box size={20} />
        </div>
        <div>
          <div className="metric-value">{products.length}</div>
          <div className="metric-label">Total FSA Items Monitored</div>
        </div>
      </div>
    </div>
  );
};
