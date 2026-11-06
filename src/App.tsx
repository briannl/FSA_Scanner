import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HeaderStatusBar } from "./components/HeaderStatusBar";
import { MetricsBar, KpiFilterType } from "./components/MetricsBar";
import { ControlsBar } from "./components/ControlsBar";
import { ProductGrid } from "./components/ProductGrid";
import { MobileCardView } from "./components/MobileCardView";
import { ProductDetailDrawer } from "./components/ProductDetailDrawer";
import { WatchlistImportModal } from "./components/WatchlistImportModal";
import { FloatingBottomNav } from "./components/FloatingBottomNav";
import {
  ProductObservation,
  PricePoint,
  TrackerStatus,
  Retailer
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

  // Priority 1: Sophisticated near-black dark mode by default
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

  // View mode state for tablet/desktop
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState<"All" | Retailer>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [discountedOnly, setDiscountedOnly] = useState<boolean>(true); // Active by default
  const [priceDropsOnly, setPriceDropsOnly] = useState<boolean>(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType>("none");

  // Selection & Modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductObservation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // CSV export function hook from AG Grid
  const [exportCsvFn, setExportCsvFn] = useState<(() => void) | null>(null);

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
        // Fallback local merge
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

  // CSV Export: Works seamlessly on both Desktop table and Mobile card view
  const handleExportCsv = () => {
    if (exportCsvFn) {
      exportCsvFn();
      return;
    }
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
    const rows = filteredProducts.map((p) => [
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

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Compute live counts per retailer
  const retailerCounts = useMemo(() => {
    const cvs = products.filter((p) => p.retailer === "CVS").length;
    const costco = products.filter((p) => p.retailer === "Costco").length;
    return { all: products.length, cvs, costco };
  }, [products]);

  // Unified multi-facet filter pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // 1. Retailer Filter
      if (selectedRetailer !== "All" && item.retailer !== selectedRetailer) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }

      // 3. Discounted Only Switch (default: ON)
      if (discountedOnly) {
        const hasDiscount =
          (item.discountPercent !== null && item.discountPercent > 0) ||
          (item.discountAmount !== null && item.discountAmount > 0) ||
          (item.promoType !== "None" && item.promoType !== "Standard Markdown");
        if (!hasDiscount) return false;
      }

      // 4. Price Drops Only Switch
      if (priceDropsOnly && !item.isRecentDrop) {
        return false;
      }

      // 5. Active KPI Card Quick Filters
      if (activeKpiFilter === "active_deals") {
        const hasVerifiedSavings =
          (item.discountPercent > 0 || item.discountAmount > 0) &&
          item.priceStatus === "confirmed";
        if (!hasVerifiedSavings) return false;
      } else if (activeKpiFilter === "recent_drops") {
        if (!item.isRecentDrop) return false;
      } else if (activeKpiFilter === "all_time_low") {
        const isLowest =
          item.lowestHistoricalPrice !== null &&
          item.currentPrice !== null &&
          item.currentPrice <= item.lowestHistoricalPrice;
        if (!isLowest) return false;
      } else if (activeKpiFilter === "best_discount") {
        // Filter to top deals (>= 20% off)
        if (item.discountPercent < 20) return false;
      }

      // 6. Free-Text Search
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesRetailer = item.retailer.toLowerCase().includes(q);
        const matchesPromo = item.promoDetails?.toLowerCase().includes(q) || false;
        const matchesPromoType = item.promoType.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesRetailer && !matchesPromo && !matchesPromoType) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    selectedRetailer,
    selectedCategory,
    discountedOnly,
    priceDropsOnly,
    activeKpiFilter,
    searchText
  ]);

  // Floating bottom nav action triggers
  const handleGoToDeals = () => {
    setSelectedCategory("All");
    setSearchText("");
    setActiveKpiFilter("none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFocusSearch = () => {
    const input = document.getElementById("fsa-search-input");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => input.focus(), 300);
    }
  };

  return (
    <div className={`app-container ${isMobileViewport ? "has-floating-nav" : ""}`}>
      {/* 1. Sticky Command Bar & Live Retailer Heartbeat Header */}
      <HeaderStatusBar
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefreshAll}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isMobile={isMobileViewport}
      />

      {/* 2. 4-Card KPI Summary Ribbon (Desktop: 4 cols, Tablet: 2 cols, Mobile: 2/1 cols) */}
      <MetricsBar
        products={products}
        activeKpiFilter={activeKpiFilter}
        onSelectKpiFilter={setActiveKpiFilter}
        onInspectProduct={(prod) => setSelectedProduct(prod)}
      />

      {/* 3. Unified Filter & Search Toolbar */}
      <ControlsBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedRetailer={selectedRetailer}
        onRetailerChange={setSelectedRetailer}
        retailerCounts={retailerCounts}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        discountedOnly={discountedOnly}
        onDiscountedOnlyChange={setDiscountedOnly}
        priceDropsOnly={priceDropsOnly}
        onPriceDropsOnlyChange={setPriceDropsOnly}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        matchedCount={filteredProducts.length}
        isMobile={isMobileViewport}
      />

      {/* 4 & 6. View Mode: Responsive Product Cards on Mobile (<768px), Spreadsheet Table on Desktop */}
      {isMobileViewport || viewMode === "card" ? (
        <MobileCardView
          products={filteredProducts}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          quickFilterText={searchText}
          onSelectProduct={(product) => setSelectedProduct(product)}
          onGridReadyExportHook={(fn) => setExportCsvFn(() => fn)}
          isDarkMode={isDarkMode}
          isTablet={isTabletViewport}
        />
      )}

      {/* 5. Slide-Over Product Inspector Drawer (Desktop) or Bottom Sheet (Mobile) */}
      <ProductDetailDrawer
        product={selectedProduct}
        history={selectedProduct ? histories[selectedProduct.id] || [] : []}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
        isMobile={isMobileViewport}
      />

      {/* Watchlist & Import Modal */}
      <WatchlistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProducts={handleImportProducts}
        onAddWatchlistUrl={handleAddWatchlistUrl}
        watchlistUrls={watchlistUrls}
      />

      {/* Floating Pill-Shaped Bottom Navigation Bar (Mobile Only) */}
      {isMobileViewport && (
        <FloatingBottomNav
          onGoToDeals={handleGoToDeals}
          onFocusSearch={handleFocusSearch}
          onOpenWatchlist={() => setIsImportModalOpen(true)}
          onRefresh={handleRefreshAll}
          isRefreshing={isRefreshing}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          activeTab={searchText ? "search" : "deals"}
        />
      )}
    </div>
  );
};
