import React from "react";
import { Tag, Compass, Bookmark } from "lucide-react";

interface FloatingBottomNavProps {
  activeMode: "deals" | "discover" | "saved";
  onNavigate: (mode: "deals" | "discover" | "saved") => void;
  savedCount?: number;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeMode,
  onNavigate,
  savedCount = 0
}) => {
  return (
    <nav
      className="floating-bottom-nav"
      aria-label="Mobile primary navigation"
      role="navigation"
    >
      <div className="minimal-nav-pill">
        {/* 1. Deals */}
        <button
          type="button"
          className={`minimal-bottom-btn ${activeMode === "deals" ? "active" : ""}`}
          onClick={() => onNavigate("deals")}
          aria-label="View curated deals"
        >
          <Tag size={19} className="nav-icon" />
          <span className="nav-label">Deals</span>
        </button>

        {/* 2. Discover & Compare */}
        <button
          type="button"
          className={`minimal-bottom-btn ${activeMode === "discover" ? "active" : ""}`}
          onClick={() => onNavigate("discover")}
          aria-label="Discover multi-store categories"
        >
          <Compass size={19} className="nav-icon" />
          <span className="nav-label">Discover</span>
        </button>

        {/* 3. Saved */}
        <button
          type="button"
          className={`minimal-bottom-btn ${activeMode === "saved" ? "active" : ""}`}
          onClick={() => onNavigate("saved")}
          aria-label="View saved deals"
        >
          <div style={{ position: "relative", display: "inline-flex" }}>
            <Bookmark size={19} className="nav-icon" />
            {savedCount > 0 && (
              <span className="nav-badge-dot" aria-hidden="true">
                {savedCount}
              </span>
            )}
          </div>
          <span className="nav-label">Saved</span>
        </button>
      </div>
    </nav>
  );
};
