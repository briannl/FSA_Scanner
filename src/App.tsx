import React, { useState, useEffect, useCallback } from "react";
import { MockupHeader } from "./components/MockupHeader";
import { EditorialHomepage } from "./components/EditorialHomepage";
import { DiscoverView } from "./components/DiscoverView";
import { SavedView } from "./components/SavedView";
import { InsightsView } from "./components/InsightsView";
import { FloatingBottomNav, NavTab } from "./components/FloatingBottomNav";
import { ProductDetailDrawer } from "./components/ProductDetailDrawer";
import { WatchlistImportModal } from "./components/WatchlistImportModal";
import { CompareOffersModal } from "./components/CompareOffersModal";
import { GroupedProduct } from "./services/productMatcher";
import { useSavedDeals } from "./hooks/useSavedDeals";
import {
  ProductObservation,
  PricePoint,
  TrackerStatus
} from "./types/product";
import {
  SEED_PRODUCTS,
  SEED_PRICE_HISTORIES,
  INITIAL_STATUS
} from "./data/seedData";

export const App: React.FC = () => {
  const [products, setProducts] = useState<ProductObservation[]>(SEED_PRODUCTS);
  const [histories, setHistories] = useState<Record<string, PricePoint[]>>(SEED_PRICE_HISTORIES);
  const [status, setStatus] = useState<TrackerStatus>(INITIAL_STATUS);
  const [watchlistUrls, setWatchlistUrls] = useState<string[]>([
    "https://www.cvs.com/shop/cvs-health-series-400-upper-arm-blood-pressure-monitor-prodid-108201",
    "https://www.costco.com/kirkland-signature-aller-tec-10-mg.-365-tablets.product.100412345.html"
  ]);

  // Saved deals custom hook
  const { savedIds, isSaved, toggleSave, clearSaved } = useSavedDeals();

  // Dark mode by default
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("fsa_theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("fsa_theme", theme);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Responsive Viewport Tracking (Desktop >=1200px, Tablet 768-1199px, Mobile <768px)
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== "undefined" ? window.innerWidth : 1440;
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileViewport = windowWidth < 768;
  const isTabletViewport = windowWidth >= 768 && windowWidth < 1200;

  // 4 Primary Navigation Destinations: "discover" | "search" | "saved" | "insights"
  const [activeTab, setActiveTab] = useState<NavTab>("discover");
  const [selectedGroupedProduct, setSelectedGroupedProduct] = useState<GroupedProduct | null>(null);

  // Selection & Modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductObservation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data from /api/products
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.histories) {
          setHistories(data.histories);
        }
        if (data.status) {
          setStatus(data.status);
        }
        if (data.watchlist && Array.isArray(data.watchlist)) {
          setWatchlistUrls(data.watchlist);
        }
      }
    } catch {
      console.info("Using embedded seed catalog fallback");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger on-demand sync
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailer: "all" })
      });
      if (res.ok) {
        await loadData();
      } else {
        const now = new Date().toISOString();
        setStatus((prev) => ({
          ...prev,
          cvs: {
            ...prev.cvs,
            status: "blocked_waf",
            lastAttempt: now,
            errorMessage: "HTTP 403: Bot protection active. Snapshot retained."
          },
          costco: {
            ...prev.costco,
            status: "blocked_waf",
            lastAttempt: now,
            errorMessage: "HTTP 403: Bot protection active. Snapshot retained."
          },
          updatedAt: now
        }));
      }
    } catch {
      console.warn("Refresh request could not reach server; retaining snapshots.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Import products from modal
  const handleImportProducts = async (imported: ProductObservation[]) => {
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_products", products: imported })
      });
      if (res.ok) {
        await loadData();
      } else {
        setProducts((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          imported.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    } catch {
      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        imported.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });
    }
    setIsImportModalOpen(false);
  };

  // Add URL to watchlist
  const handleAddWatchlistUrl = async (url: string) => {
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_watchlist", url })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.watchlist) {
          setWatchlistUrls(data.watchlist);
        }
      } else {
        setWatchlistUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
      }
    } catch {
      setWatchlistUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      "Retailer",
      "Name",
      "Category",
      "Current Price",
      "Regular Price",
      "Discount %",
      "Discount $",
      "Unit Price",
      "Promo Type",
      "Promo Details",
      "Product URL"
    ];
    const sourceProducts = activeTab === "saved"
      ? products.filter((p) => savedIds.includes(p.id))
      : products;

    const rows = sourceProducts.map((p) => [
      `"${p.retailer}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.currentPrice !== null ? p.currentPrice.toFixed(2) : "",
      p.regularPrice !== null ? p.regularPrice.toFixed(2) : "",
      p.discountPercent > 0 ? `${p.discountPercent}%` : "",
      p.discountAmount > 0 ? `$${p.discountAmount.toFixed(2)}` : "",
      `"${p.unitPrice || ""}"`,
      `"${p.promoType}"`,
      `"${(p.promoDetails || "").replace(/"/g, '""')}"`,
      `"${p.productUrl}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fsa_deals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container has-floating-nav">
      {/* 1. Pixel-Accurate Mockup Header */}
      <MockupHeader
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefreshAll}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* 2. Main Destinations */}
      <main className="app-main-content">
        {activeTab === "discover" ? (
          /* Mockup Homepage: Editorial Hero + 2 Summary Cards + Today's Deals + Big Deal Cards */
          <EditorialHomepage
            products={products}
            status={status}
            onInspectProduct={(prod) => setSelectedProduct(prod)}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
          />
        ) : activeTab === "search" ? (
          /* Multi-Store Search & Compare with 3 Bottom Sheet Filters */
          <DiscoverView
            products={products}
            isSaved={isSaved}
            onToggleSave={toggleSave}
            onInspectProduct={(prod) => setSelectedProduct(prod)}
            onCompareProduct={(grp) => setSelectedGroupedProduct(grp)}
            isMobile={isMobileViewport}
          />
        ) : activeTab === "saved" ? (
          /* Saved Deals & Watchlist URLs */
          <SavedView
            products={products}
            savedIds={savedIds}
            onToggleSave={toggleSave}
            onClearSaved={clearSaved}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onGoToDeals={() => setActiveTab("discover")}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onExportCsv={handleExportCsv}
            watchlistUrls={watchlistUrls}
            onAddWatchlistUrl={handleAddWatchlistUrl}
          />
        ) : (
          /* Insights: Price Drops, Statistics, and Interactive AG Grid Spreadsheet */
          <InsightsView
            products={products}
            onInspectProduct={(prod) => setSelectedProduct(prod)}
            onExportCsv={handleExportCsv}
            isDarkMode={isDarkMode}
            isTablet={isTabletViewport}
          />
        )}
      </main>

      {/* 3. Product Inspector Drawer / Bottom Sheet */}
      <ProductDetailDrawer
        product={selectedProduct}
        history={selectedProduct ? histories[selectedProduct.id] || [] : []}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
        isMobile={isMobileViewport}
      />

      {/* 4. Multi-Store Compare Offers Modal */}
      <CompareOffersModal
        product={selectedGroupedProduct}
        onClose={() => setSelectedGroupedProduct(null)}
        isDarkMode={isDarkMode}
      />

      {/* 5. Watchlist & Import Modal */}
      <WatchlistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProducts={handleImportProducts}
        onAddWatchlistUrl={handleAddWatchlistUrl}
        watchlistUrls={watchlistUrls}
      />

      {/* 6. Floating Pill Bottom Navigation (4 Destinations matching mockup) */}
      <FloatingBottomNav
        activeTab={activeTab}
        onNavigate={setActiveTab}
        savedCount={savedIds.length}
      />
    </div>
  );
};
