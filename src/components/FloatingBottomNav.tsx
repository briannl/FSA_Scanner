import React from "react";
import { LayoutGrid, Search, Bookmark, BarChart2 } from "lucide-react";

export type NavTab = "discover" | "search" | "saved" | "insights";

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
        {/* Tab 1: Discover (Homepage) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => onNavigate("discover")}
          aria-label="Discover deals"
        >
          <LayoutGrid size={18} strokeWidth={2.4} />
          {activeTab === "discover" && <span className="mockup-nav-label">Discover</span>}
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

        {/* Tab 3: Saved (Watchlist) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => onNavigate("saved")}
          aria-label="Saved products"
        >
          <div style={{ position: "relative", display: "inline-flex" }}>
            <Bookmark size={19} strokeWidth={2.2} />
            {savedCount > 0 && activeTab !== "saved" && (
              <span className="mockup-nav-dot" aria-hidden="true" />
            )}
          </div>
          {activeTab === "saved" && <span className="mockup-nav-label">Saved</span>}
        </button>

        {/* Tab 4: Insights (Analytics & Spreadsheet) */}
        <button
          type="button"
          className={`mockup-nav-item ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => onNavigate("insights")}
          aria-label="Price insights and spreadsheet"
        >
          <BarChart2 size={19} strokeWidth={2.2} />
          {activeTab === "insights" && <span className="mockup-nav-label">Insights</span>}
        </button>
      </div>
    </nav>
  );
};
