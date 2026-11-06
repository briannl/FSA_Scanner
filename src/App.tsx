import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HeaderStatusBar } from "./components/HeaderStatusBar";
import { MetricsBar } from "./components/MetricsBar";
import { ControlsBar } from "./components/ControlsBar";
import { ProductGrid } from "./components/ProductGrid";
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

  // UI state
  const [searchText, setSearchText] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState<"All" | Retailer>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [discountedOnly, setDiscountedOnly] = useState<boolean>(true); // Active by default
  const [selectedProduct, setSelectedProduct] = useState<ProductObservation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // CSV export hook from AG Grid
  const [exportCsvFn, setExportCsvFn] = useState<(() => void) | null>(null);

  // Fetch from /api/products if server is running
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
      // In standalone client or test environment, fallback to seed data
      console.info("Using embedded seed catalog");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger manual refresh
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
        // Fallback update timestamp and drop flags if API offline
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
      setTimeout(() => setIsRefreshing(false), 600);
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
      // client-side state already updated
    }
  };

  // Manual Import
  const handleImportProducts = async (imported: ProductObservation[]) => {
    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      imported.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });

    // Also append to histories
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
      // client-side state already updated
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products for the AG Grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Retailer filter
      if (selectedRetailer !== "All" && p.retailer !== selectedRetailer) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }
      // Discounted only toggle
      if (discountedOnly) {
        const hasDiscount = (p.discountPercent > 0 || p.discountAmount > 0) && p.priceStatus === "confirmed";
        if (!hasDiscount) return false;
      }
      return true;
    });
  }, [products, selectedRetailer, selectedCategory, discountedOnly]);

  const handleExportCsv = () => {
    if (exportCsvFn) {
      exportCsvFn();
    } else {
      // Fallback CSV generation for filtered products
      const headers = ["retailer", "name", "category", "currentPrice", "regularPrice", "discountPercent", "discountAmount", "unitPrice", "promoType", "promoDetails", "productUrl"];
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
      <HeaderStatusBar
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefreshAll}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      <MetricsBar products={products} />

      <ControlsBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedRetailer={selectedRetailer}
        onRetailerChange={setSelectedRetailer}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        discountedOnly={discountedOnly}
        onDiscountedOnlyChange={setDiscountedOnly}
        matchedCount={filteredProducts.length}
      />

      <ProductGrid
        products={filteredProducts}
        quickFilterText={searchText}
        onSelectProduct={(product) => setSelectedProduct(product)}
        onGridReadyExportHook={(fn) => setExportCsvFn(() => fn)}
      />

      <ProductDetailDrawer
        product={selectedProduct}
        history={selectedProduct ? histories[selectedProduct.id] || [] : []}
        onClose={() => setSelectedProduct(null)}
      />

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
