import React, { useState, useEffect, useCallback } from "react";
import { MockupHeader } from "./components/MockupHeader";
import { ScannerHome } from "./components/ScannerHome";
import { EditorialHomepage } from "./components/EditorialHomepage";
import { DiscoverView } from "./components/DiscoverView";
import { SavedView } from "./components/SavedView";
import { FloatingBottomNav, NavTab } from "./components/FloatingBottomNav";
import { ProductDetailDrawer } from "./components/ProductDetailDrawer";
import { WatchlistImportModal } from "./components/WatchlistImportModal";
import { CompareOffersModal } from "./components/CompareOffersModal";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { ManualBarcodeEntryModal } from "./components/ManualBarcodeEntryModal";
import { ManualProductIdentificationModal } from "./components/ManualProductIdentificationModal";
import { ScanResultModal } from "./components/ScanResultModal";
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
import { ScannedProduct } from "./types/scanner";
import { ProductLookupService } from "./services/ProductLookupService";
import {
  buildScannedProduct,
  EvaluationInput
} from "./services/FSAEligibilityEngine";
import { ScanHistoryService } from "./services/ScanHistoryService";
import { normalizeBarcode } from "./utils/barcodeUtils";
import { WifiOff } from "lucide-react";

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

  // Offline network status tracking
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 4 Primary Navigation Destinations: "scan" | "search" | "saved" | "deals"
  // Scan is the default homepage as requested
  const [activeTab, setActiveTab] = useState<NavTab>("scan");
  const [selectedGroupedProduct, setSelectedGroupedProduct] = useState<GroupedProduct | null>(null);

  // Selection & Modal states
  const [selectedProduct, setSelectedProduct] = useState<ProductObservation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Scanner Modals State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualBarcodeOpen, setIsManualBarcodeOpen] = useState(false);
  const [unidentifiedBarcode, setUnidentifiedBarcode] = useState<string | null>(null);
  const [scannedProductResult, setScannedProductResult] = useState<ScannedProduct | null>(null);

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

  // Ensure camera scanner is completely closed whenever user leaves the Scan tab
  useEffect(() => {
    if (activeTab !== "scan") {
      setIsScannerOpen(false);
      setIsManualBarcodeOpen(false);
    }
  }, [activeTab]);

  // Handle scanned or entered barcode
  const handleBarcodeDetected = async (rawBarcode: string) => {
    const barcode = normalizeBarcode(rawBarcode);
    if (!barcode) return;

    // Immediately dismiss scanner and tear down camera pipeline before async product lookup
    setIsScannerOpen(false);
    setIsManualBarcodeOpen(false);

    // 1. Perform modular product lookup
    const lookupResult = await ProductLookupService.lookupByBarcode(barcode, products);

    if (lookupResult) {
      // Product recognized: evaluate FSA eligibility
      const scanned = buildScannedProduct({
        barcode,
        name: lookupResult.name,
        brand: lookupResult.brand,
        category: lookupResult.category,
        ingredientsText: lookupResult.ingredientsText,
        imageUrl: lookupResult.imageUrl,
        matchingDealsCatalog: products
      });

      // Add to local scan history
      ScanHistoryService.addToHistory(scanned);

      // Show result
      setScannedProductResult(scanned);
    } else {
      // Product not found: allow user to identify product without fabricating
      setUnidentifiedBarcode(barcode);
    }
  };

  // Handle manual product identification submission
  const handleManualIdentificationSubmit = (
    data: EvaluationInput & { labelPhoto?: string | null }
  ) => {
    const scanned = buildScannedProduct({
      ...data,
      matchingDealsCatalog: products
    });

    if (data.labelPhoto) {
      scanned.userAddedLabelPhoto = data.labelPhoto;
    }

    // Add to history
    ScanHistoryService.addToHistory(scanned, data.storeName, data.price);

    // Show result
    setUnidentifiedBarcode(null);
    setScannedProductResult(scanned);
  };

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

  // CSV Export for deals
  const handleExportCsv = () => {
    const headers = [
      "Retailer",
      "Name",
      "Category",
      "Current Price",
      "Regular Price",
      "Discount %",
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
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="offline-network-banner" role="status">
          <WifiOff size={14} />
          <span>Offline Mode — Showing cached FSA verification & local scan history</span>
        </div>
      )}

      {/* 1. Mockup Header */}
      <MockupHeader
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefreshAll}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        subtitle="Your shopping companion"
      />

      {/* 2. Main Navigation Destinations */}
      <main className="app-main-content">
        {activeTab === "scan" ? (
          /* Main Homepage: In-Store Barcode Scanner */
          <ScannerHome
            onStartScanning={() => setIsScannerOpen(true)}
            onEnterManually={() => setIsManualBarcodeOpen(true)}
            onInspectScannedProduct={(product) => setScannedProductResult(product)}
            onViewAllSaved={() => setActiveTab("saved")}
          />
        ) : activeTab === "search" ? (
          /* Multi-Store Search & Compare */
          <DiscoverView
            products={products}
            isSaved={isSaved}
            onToggleSave={toggleSave}
            onInspectProduct={(prod) => setSelectedProduct(prod)}
            onCompareProduct={(grp) => setSelectedGroupedProduct(grp)}
            isMobile={isMobileViewport}
          />
        ) : activeTab === "saved" ? (
          /* Saved Scans & Watchlist Deals */
          <SavedView
            products={products}
            savedIds={savedIds}
            onToggleSave={toggleSave}
            onClearSaved={clearSaved}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onGoToDeals={() => setActiveTab("deals")}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onExportCsv={handleExportCsv}
            watchlistUrls={watchlistUrls}
            onAddWatchlistUrl={handleAddWatchlistUrl}
            onInspectScannedProduct={(product) => setScannedProductResult(product)}
            onGoToScan={() => setActiveTab("scan")}
          />
        ) : (
          /* Deals: Editorial Homepage with Today's Deals Feed */
          <EditorialHomepage
            products={products}
            status={status}
            onInspectProduct={(prod) => setSelectedProduct(prod)}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
          />
        )}
      </main>

      {/* 3. Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
        onManualEntry={() => {
          setIsScannerOpen(false);
          setIsManualBarcodeOpen(true);
        }}
      />

      {/* 4. Manual Barcode Numeric Entry Modal */}
      <ManualBarcodeEntryModal
        isOpen={isManualBarcodeOpen}
        onClose={() => setIsManualBarcodeOpen(false)}
        onSubmitBarcode={handleBarcodeDetected}
      />

      {/* 5. Manual Product Identification Modal (Product Not Found) */}
      <ManualProductIdentificationModal
        isOpen={Boolean(unidentifiedBarcode)}
        barcode={unidentifiedBarcode || ""}
        onClose={() => setUnidentifiedBarcode(null)}
        onSubmit={handleManualIdentificationSubmit}
      />

      {/* 6. Scan Result Details Modal */}
      <ScanResultModal
        isOpen={Boolean(scannedProductResult)}
        product={scannedProductResult}
        onClose={() => setScannedProductResult(null)}
        onScanAnother={() => {
          setScannedProductResult(null);
          setIsScannerOpen(true);
        }}
        onViewMatchingDeal={(dealId) => {
          const deal = products.find((p) => p.id === dealId);
          if (deal) {
            setSelectedProduct(deal);
            setActiveTab("deals");
          }
        }}
      />

      {/* 7. Product Detail Drawer for Online Deals */}
      <ProductDetailDrawer
        product={selectedProduct}
        history={selectedProduct ? histories[selectedProduct.id] || [] : []}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
        isMobile={isMobileViewport}
      />

      {/* 8. Multi-Store Compare Offers Modal */}
      <CompareOffersModal
        product={selectedGroupedProduct}
        onClose={() => setSelectedGroupedProduct(null)}
        isDarkMode={isDarkMode}
      />

      {/* 9. Watchlist Import Modal */}
      <WatchlistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProducts={handleImportProducts}
        onAddWatchlistUrl={handleAddWatchlistUrl}
        watchlistUrls={watchlistUrls}
      />

      {/* 10. Floating Pill Bottom Navigation (Scan / Search / Saved / Deals) */}
      <FloatingBottomNav
        activeTab={activeTab}
        onNavigate={setActiveTab}
        savedCount={savedIds.length + ScanHistoryService.getSaved().length}
      />
    </div>
  );
};
