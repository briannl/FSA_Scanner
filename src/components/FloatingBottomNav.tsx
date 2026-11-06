import React from "react";
import { ScanBarcode, Search, Bookmark, Tag } from "lucide-react";

export type NavTab = "scan" | "search" | "saved" | "deals";

interface FloatingBottomNavProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  savedCount?: number;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onNavigate,
  savedCount = 0
}) => {
  return (
    <nav
      className="mockup-floating-nav"
      aria-label="Bottom Navigation"
      role="navigation"
    >
      <div className="mockup-nav-capsule">
        {/* Tab 1: Scan (Default In-Store Homepage) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "scan" ? "active" : ""}`}
          onClick={() => onNavigate("scan")}
          aria-label="Scan product barcode"
        >
          <ScanBarcode size={19} strokeWidth={2.4} />
          {activeTab === "scan" && <span className="mockup-nav-label">Scan</span>}
        </button>

        {/* Tab 2: Search (Multi-Store Discovery & Filters) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "search" ? "active" : ""}`}
          onClick={() => onNavigate("search")}
          aria-label="Search and filter products"
        >
          <Search size={19} strokeWidth={2.2} />
          {activeTab === "search" && <span className="mockup-nav-label">Search</span>}
        </button>

        {/* Tab 3: Saved (Watchlist & Scans) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => onNavigate("saved")}
          aria-label="Saved products and scans"
        >
          <div style={{ position: "relative", display: "inline-flex" }}>
            <Bookmark size={19} strokeWidth={2.2} />
            {savedCount > 0 && activeTab !== "saved" && (
              <span className="mockup-nav-dot" aria-hidden="true" />
            )}
          </div>
          {activeTab === "saved" && <span className="mockup-nav-label">Saved</span>}
        </button>

        {/* Tab 4: Deals (Today's Deals, Summary Cards & Spreadsheet) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "deals" ? "active" : ""}`}
          onClick={() => onNavigate("deals")}
          aria-label="Active FSA deals and discounts"
        >
          <Tag size={19} strokeWidth={2.2} />
          {activeTab === "deals" && <span className="mockup-nav-label">Deals</span>}
        </button>
      </div>
    </nav>
  );
};
