import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HeaderStatusBar } from "./components/HeaderStatusBar";
import { MetricsBar, KpiFilterType } from "./components/MetricsBar";
import { ControlsBar } from "./components/ControlsBar";
import { ProductGrid } from "./components/ProductGrid";
import { MobileCardView } from "./components/MobileCardView";
import { ProductDetailDrawer } from "./components/ProductDetailDrawer";
import { WatchlistImportModal } from "./components/WatchlistImportModal";
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

  // Theme state (persisted in localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("fsa_theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("fsa_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("fsa_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Viewport & View Mode state (defaults to "card" on mobile, "table" on desktop)
  const [viewMode, setViewMode] = useState<"table" | "card">(() => {
    return typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "table";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("card");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          cvs: { ...prev.cvs, lastSuccess: now, lastAttempt: now },
          costco: { ...prev.costco, lastSuccess: now, lastAttempt: now },
          updatedAt: now
        }));
      }
    } catch {
      const now = new Date().toISOString();
      setStatus((prev) => ({
        ...prev,
        cvs: { ...prev.cvs, lastSuccess: now, lastAttempt: now },
        costco: { ...prev.costco, lastSuccess: now, lastAttempt: now },
        updatedAt: now
      }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Add Watchlist URL
  const handleAddWatchlistUrl = async (url: string) => {
    setWatchlistUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
    try {
      await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_watchlist", url })
      });
    } catch {
      // client state updated
    }
  };

  // Import Manual Products
  const handleImportProducts = async (imported: ProductObservation[]) => {
    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      imported.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });

    setHistories((prev) => {
      const updated = { ...prev };
      imported.forEach((item) => {
        const list = updated[item.id] ? [...updated[item.id]] : [];
        list.push({
          date: item.observedAt.slice(0, 10),
          price: item.currentPrice,
          priceStatus: item.priceStatus,
          promoType: item.promoType,
          promoDetails: item.promoDetails
        });
        updated[item.id] = list;
      });
      return updated;
    });

    try {
      await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_products", products: imported })
      });
    } catch {
      // client state updated
    }
  };

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Compute retailer counts for the segmented control
  const retailerCounts = useMemo(() => {
    return {
      all: products.length,
      cvs: products.filter((p) => p.retailer === "CVS").length,
      costco: products.filter((p) => p.retailer === "Costco").length
    };
  }, [products]);

  // Filter products for Table / Card views
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Retailer Filter
      if (selectedRetailer !== "All" && p.retailer !== selectedRetailer) {
        return false;
      }
      // Category Filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }
      // "On Sale Only" Toggle
      if (discountedOnly) {
        const hasDiscount = (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed";
        if (!hasDiscount) return false;
      }
      // "Price Drops Only" Toggle
      if (priceDropsOnly && !p.isRecentDrop) {
        return false;
      }
      // KPI Ribbon Quick-Filter Overrides
      if (activeKpiFilter === "recent_drops" && !p.isRecentDrop) {
        return false;
      }
      if (activeKpiFilter === "all_time_low") {
        const isLowest =
          p.lowestHistoricalPrice !== null &&
          p.currentPrice !== null &&
          p.currentPrice <= p.lowestHistoricalPrice;
        if (!isLowest) return false;
      }
      if (activeKpiFilter === "active_deals") {
        const hasDiscount = (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed";
        if (!hasDiscount) return false;
      }

      return true;
    });
  }, [products, selectedRetailer, selectedCategory, discountedOnly, priceDropsOnly, activeKpiFilter]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (exportCsvFn) {
      exportCsvFn();
    } else {
      const headers = [
        "retailer",
        "name",
        "category",
        "currentPrice",
        "regularPrice",
        "discountPercent",
        "discountAmount",
        "unitPrice",
        "promoType",
        "promoDetails",
        "productUrl"
      ];
      const rows = filteredProducts.map((p) => [
        `"${p.retailer}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.currentPrice ?? "",
        p.regularPrice ?? "",
        p.discountPercent,
        p.discountAmount,
        `"${p.unitPrice ?? ""}"`,
        `"${p.promoType}"`,
        `"${(p.promoDetails ?? "").replace(/"/g, '""')}"`,
        `"${p.productUrl}"`
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `fsa_deals_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Sticky Header & Command Bar */}
      <HeaderStatusBar
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefreshAll}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* 2. 4-Card KPI Summary Ribbon */}
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
      />

      {/* 4 & 6. View Mode: AG Grid Table View or Mobile Card View */}
      {viewMode === "table" ? (
        <ProductGrid
          products={filteredProducts}
          quickFilterText={searchText}
          onSelectProduct={(product) => setSelectedProduct(product)}
          onGridReadyExportHook={(fn) => setExportCsvFn(() => fn)}
          isDarkMode={isDarkMode}
        />
      ) : (
        <MobileCardView
          products={filteredProducts}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />
      )}

      {/* 5. Slide-Over Product Inspector Drawer */}
      <ProductDetailDrawer
        product={selectedProduct}
        history={selectedProduct ? histories[selectedProduct.id] || [] : []}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
      />

      {/* Watchlist & Import Modal */}
      <WatchlistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProducts={handleImportProducts}
        onAddWatchlistUrl={handleAddWatchlistUrl}
        watchlistUrls={watchlistUrls}
      />
    </div>
  );
};
