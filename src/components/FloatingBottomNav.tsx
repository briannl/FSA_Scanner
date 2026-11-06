import React from "react";
import {
  Sparkles,
  Search,
  BookmarkPlus,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";

interface FloatingBottomNavProps {
  onGoToDeals: () => void;
  onFocusSearch: () => void;
  onOpenWatchlist: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activeTab?: "deals" | "search" | "watchlist";
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  onGoToDeals,
  onFocusSearch,
  onOpenWatchlist,
  onRefresh,
  isRefreshing,
  isDarkMode,
  onToggleTheme,
  activeTab = "deals"
}) => {
  return (
    <nav
      className="floating-bottom-nav"
      aria-label="Mobile quick actions"
      role="navigation"
    >
      <div className="floating-nav-pill">
        {/* 1. Deals / Home */}
        <button
          type="button"
          className={`floating-nav-btn ${activeTab === "deals" ? "active" : ""}`}
          onClick={onGoToDeals}
          aria-label="View all deals"
          title="Top Deals"
        >
          <Sparkles size={18} className="nav-icon" />
          <span className="nav-label">Deals</span>
        </button>

        {/* 2. Search & Filter */}
        <button
          type="button"
          className={`floating-nav-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={onFocusSearch}
          aria-label="Search and filter deals"
          title="Search"
        >
          <Search size={18} className="nav-icon" />
          <span className="nav-label">Search</span>
        </button>

        {/* 3. Watchlist & Import */}
        <button
          type="button"
          className="floating-nav-btn"
          onClick={onOpenWatchlist}
          aria-label="Open watchlist and custom deals"
          title="Watchlist"
        >
          <BookmarkPlus size={18} className="nav-icon" />
          <span className="nav-label">Watchlist</span>
        </button>

        {/* 4. On-demand Sync */}
        <button
          type="button"
          className={`floating-nav-btn ${isRefreshing ? "refreshing" : ""}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Sync latest prices from CVS and Costco"
          title="Sync Now"
        >
          <RefreshCw size={17} className={`nav-icon ${isRefreshing ? "spin-icon" : ""}`} />
          <span className="nav-label">{isRefreshing ? "Syncing" : "Sync"}</span>
        </button>

        {/* 5. Theme Toggle */}
        <button
          type="button"
          className="floating-nav-btn"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? "Switch to Soft Pastel Light Mode" : "Switch to Near-Black Dark Mode"}
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? (
            <Sun size={18} className="nav-icon" />
          ) : (
            <Moon size={18} className="nav-icon" />
          )}
          <span className="nav-label">{isDarkMode ? "Light" : "Dark"}</span>
        </button>
      </div>
    </nav>
  );
};
