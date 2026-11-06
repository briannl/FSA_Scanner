import React, { useState, useMemo } from "react";
import { ProductObservation, Retailer } from "../types/product";
import { groupProductsAcrossRetailers, GroupedProduct } from "../services/productMatcher";
import { StoreFilterSheet } from "./StoreFilterSheet";
import { CategoryFilterSheet } from "./CategoryFilterSheet";
import { FilterOptionsSheet } from "./FilterOptionsSheet";
import {
  Search,
  SlidersHorizontal,
  Store,
  FolderTree,
  ChevronRight,
  ArrowUpDown,
  Bookmark,
  Package,
  CheckCircle2,
  X
} from "lucide-react";

interface DiscoverViewProps {
  products: ProductObservation[];
  onInspectProduct: (product: ProductObservation) => void;
  onCompareProduct: (product: GroupedProduct) => void;
  isSaved?: (id: string) => boolean;
  onToggleSave?: (product: ProductObservation) => void;
  isMobile?: boolean;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  products,
  onInspectProduct,
  onCompareProduct,
  isSaved = () => false,
  onToggleSave = () => {},
  isMobile = false
}) => {
  // Search & Sorting state
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"savings" | "price_asc" | "unit_price" | "name">("savings");

  // Sheet filter states (Multiselect arrays, empty means All)
  const [selectedRetailers, setSelectedRetailers] = useState<Retailer[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [discountedOnly, setDiscountedOnly] = useState<boolean>(true);
  const [priceDropsOnly, setPriceDropsOnly] = useState<boolean>(false);
  const [minDiscountPercent, setMinDiscountPercent] = useState<number>(0);
  const [zipCode, setZipCode] = useState<string>("90210");

  // Sheet visibility states
  const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);

  // 1. Group all products into normalized multi-store items
  const allGrouped = useMemo(() => {
    return groupProductsAcrossRetailers(products);
  }, [products]);

  // 2. Accurate Counts derived from currently eligible product data
  const retailerCounts = useMemo(() => {
    const counts: Record<Retailer, number> = {
      Costco: 0,
      CVS: 0,
      Amazon: 0,
      Ralphs: 0,
      Vons: 0,
      Instacart: 0,
      "Smart & Final": 0,
      "H Mart": 0,
      "99 Ranch": 0,
      "Trader Joe's": 0
    };
    allGrouped.forEach((item) => {
      const seen = new Set<Retailer>();
      item.offers.forEach((o) => {
        if (!seen.has(o.retailer)) {
          seen.add(o.retailer);
          counts[o.retailer] = (counts[o.retailer] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allGrouped]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allGrouped.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allGrouped]);

  // 3. Filter grouped items by active sheets & search
  const filteredProducts = useMemo(() => {
    return allGrouped.filter((item) => {
      // Free-text query
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBrand = item.brand.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesOffers = item.offers.some(
          (o) =>
            o.retailer.toLowerCase().includes(q) ||
            o.promoDetails?.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesBrand && !matchesCat && !matchesOffers) {
          return false;
        }
      }

      // Retailers multiselect
      if (selectedRetailers.length > 0) {
        const hasSelectedRetailer = item.offers.some((o) =>
          selectedRetailers.includes(o.retailer)
        );
        if (!hasSelectedRetailer) return false;
      }

      // Categories multiselect
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(item.category)) return false;
      }

      // Discounted Only
      if (discountedOnly) {
        const hasDiscount = item.offers.some(
          (o) =>
            (o.regularPrice !== null && o.currentPrice !== null && o.regularPrice > o.currentPrice) ||
            (o.promoType !== "None" && o.promoType !== "Standard Markdown")
        );
        if (!hasDiscount && item.maxSavingsPercent <= 0) return false;
      }

      // Minimum Discount %
      if (minDiscountPercent > 0) {
        if (item.maxSavingsPercent < minDiscountPercent) return false;
      }

      // Recent Price Drops
      if (priceDropsOnly) {
        const hasDrop = item.offers.some((o) =>
          products.some((p) => p.id === o.id && p.isRecentDrop)
        );
        if (!hasDrop) return false;
      }

      return true;
    });
  }, [
    allGrouped,
    searchText,
    selectedRetailers,
    selectedCategories,
    discountedOnly,
    minDiscountPercent,
    priceDropsOnly
  ]);

  // 4. Sort grouped products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === "savings") {
        return b.maxSavingsPercent - a.maxSavingsPercent;
      }
      if (sortBy === "price_asc") {
        return (a.lowestPrice || 0) - (b.lowestPrice || 0);
      }
      if (sortBy === "unit_price") {
        const getVal = (item: GroupedProduct) => {
          if (!item.lowestUnitPrice) return 999999;
          const match = item.lowestUnitPrice.match(/\$([0-9.]+)/);
          return match ? parseFloat(match[1]) : 999999;
        };
        return getVal(a) - getVal(b);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredProducts, sortBy]);

  // Toggle handlers for sheets
  const handleToggleRetailer = (retailer: Retailer) => {
    setSelectedRetailers((prev) =>
      prev.includes(retailer) ? prev.filter((r) => r !== retailer) : [...prev, retailer]
    );
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleResetAdvanced = () => {
    setDiscountedOnly(false);
    setPriceDropsOnly(false);
    setMinDiscountPercent(0);
    setZipCode("90210");
  };

  const hasAdvancedFilters =
    !discountedOnly || priceDropsOnly || minDiscountPercent > 0 || zipCode !== "90210";

  return (
    <div className="discover-container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.25rem 3rem 1.25rem" }}>
      {/* 1. Header & Title with Compact Status */}
      <div className="discover-header-block">
        <div className="discover-header-top">
          <div>
            <h2 className="discover-title">Discover Stores & Compare</h2>
            <p className="discover-subtitle">
              Cross-store prices across 10 retailers • Strict IRS §213(d) physical medical products
            </p>
          </div>
        </div>

        {/* 2. Full-Width Search Input */}
        <div className="discover-search-wrap">
          <Search size={16} className="discover-search-icon" />
          <input
            type="text"
            className="pill-input font-sans discover-search-input"
            placeholder="Search products, brands, active ingredients..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              type="button"
              className="discover-search-clear"
              onClick={() => setSearchText("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 3. Three Compact Filter Buttons: Store, Category, Filters */}
        <div className="compact-filters-row">
          {/* Store Filter Button */}
          <button
            type="button"
            className={`compact-filter-btn ${selectedRetailers.length > 0 ? "active" : ""}`}
            onClick={() => setIsStoreSheetOpen(true)}
          >
            <Store size={14} />
            <span>
              Store {selectedRetailers.length > 0 ? `(${selectedRetailers.length})` : ""}
            </span>
          </button>

          {/* Category Filter Button */}
          <button
            type="button"
            className={`compact-filter-btn ${selectedCategories.length > 0 ? "active" : ""}`}
            onClick={() => setIsCategorySheetOpen(true)}
          >
            <FolderTree size={14} />
            <span>
              Category {selectedCategories.length > 0 ? `(${selectedCategories.length})` : ""}
            </span>
          </button>

          {/* Advanced Filters Button */}
          <button
            type="button"
            className={`compact-filter-btn ${hasAdvancedFilters ? "active" : ""}`}
            onClick={() => setIsOptionsSheetOpen(true)}
          >
            <SlidersHorizontal size={14} />
            <span>
              Filters {hasAdvancedFilters ? "•" : ""}
            </span>
          </button>
        </div>

        {/* 4. Result Count & Sort Menu */}
        <div className="discover-meta-row">
          <div className="discover-result-count">
            Showing <strong>{sortedProducts.length}</strong> verified products
          </div>

          <div className="discover-sort-cluster">
            <ArrowUpDown size={13} style={{ color: "var(--text-muted)" }} />
            <select
              className="pill-select font-sans"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ fontSize: "0.775rem", padding: "0.3rem 0.65rem" }}
            >
              <option value="savings">Highest % Savings</option>
              <option value="price_asc">Lowest Price</option>
              <option value="unit_price">Best Unit Price</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Product Results Feed */}
      {sortedProducts.length === 0 ? (
        <div className="mobile-empty-state" style={{ marginTop: "2rem" }}>
          <Package size={36} style={{ margin: "0 auto 0.75rem auto", opacity: 0.4, color: "var(--lavender)" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>No products matched your filters</h3>
          <p style={{ fontSize: "0.825rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>
            Try resetting your active store or category selections.
          </p>
          <button
            type="button"
            className="btn btn-secondary font-sans"
            onClick={() => {
              setSelectedRetailers([]);
              setSelectedCategories([]);
              setSearchText("");
            }}
            style={{ marginTop: "1rem", borderRadius: "var(--radius-pill)", padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}
          >
            Clear Active Filters
          </button>
        </div>
      ) : isMobile ? (
        /* Mobile Cards Feed */
        <div className="mobile-cards-grid">
          {sortedProducts.map((item) => {
            const rawProduct = products.find((p) => p.name === item.name) || products[0];
            const saved = rawProduct ? isSaved(rawProduct.id) : false;

            return (
              <article
                key={item.id}
                className="minimal-product-card"
                onClick={() => onCompareProduct(item)}
              >
                <div className="minimal-card-main">
                  <div className="minimal-card-thumb">
                    <div className="minimal-card-icon-wrap">
                      <Package size={20} />
                    </div>
                  </div>

                  <div className="minimal-card-body">
                    <div className="minimal-card-meta">
                      <span className="minimal-card-retailer text-lime font-mono" style={{ fontWeight: 700 }}>
                        Best at {item.bestRetailer}
                      </span>
                      <span className="minimal-meta-dot">•</span>
                      <span className="minimal-fsa-verified">
                        <CheckCircle2 size={12} className="fsa-check-icon" />
                        <span>{item.category}</span>
                      </span>
                    </div>

                    <h3 className="minimal-card-title">{item.name}</h3>

                    <div className="minimal-card-pricing">
                      <div className="minimal-price-cluster">
                        <span className="minimal-price-current font-mono text-lime">
                          ${item.lowestPrice?.toFixed(2)}
                        </span>
                        {item.maxSavingsPercent > 0 && (
                          <span className="minimal-discount-pill font-mono">
                            Save {item.maxSavingsPercent}%
                          </span>
                        )}
                      </div>

                      {item.lowestUnitPrice && (
                        <span className="minimal-unit-price font-mono">
                          {item.lowestUnitPrice}
                          {item.hasDifferentPackSizes && (
                            <span style={{ color: "var(--amber)", marginLeft: "0.3rem" }}>
                              (packs differ)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Store offer chips preview */}
                    <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
                      {item.offers.map((o) => (
                        <span
                          key={o.id}
                          className={`badge ${o.isBestOffer ? "badge-lime" : "badge-subtle"} font-sans`}
                          style={{ borderRadius: "var(--radius-pill)", fontSize: "0.65rem", padding: "0.1rem 0.45rem" }}
                        >
                          {o.retailer}: ${o.currentPrice}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="minimal-card-footer">
                  <button
                    type="button"
                    className={`minimal-save-btn ${saved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (rawProduct) onToggleSave(rawProduct);
                    }}
                    title={saved ? "Remove from saved" : "Save deal"}
                  >
                    <Bookmark
                      size={16}
                      fill={saved ? "var(--lavender)" : "none"}
                      stroke={saved ? "var(--lavender)" : "currentColor"}
                    />
                    <span className="minimal-action-text">{saved ? "Saved" : "Save"}</span>
                  </button>

                  <div className="minimal-footer-right">
                    <button
                      type="button"
                      className="minimal-inspect-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectProduct(rawProduct);
                      }}
                    >
                      Inspect
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary font-sans"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompareProduct(item);
                      }}
                      style={{
                        borderRadius: "var(--radius-pill)",
                        padding: "0.35rem 0.85rem",
                        fontSize: "0.775rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontWeight: 700
                      }}
                    >
                      <span>Compare ({item.offers.length})</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden"
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "0.85rem 1.15rem" }}>Product & FSAFEDS Category</th>
                <th style={{ padding: "0.85rem 1rem" }}>Best Price & Store</th>
                <th style={{ padding: "0.85rem 1rem" }}>Unit Price</th>
                <th style={{ padding: "0.85rem 1rem" }}>Cross-Store Spread</th>
                <th style={{ padding: "0.85rem 1rem" }}>Store Offers</th>
                <th style={{ padding: "0.85rem 1.15rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((item) => {
                const rawProduct = products.find((p) => p.name === item.name) || products[0];
                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background-color var(--trans-fast)"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.15rem", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <span className="badge badge-lavender font-sans" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Brand: {item.brand}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                      <div className="font-mono text-lime" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                        ${item.lowestPrice?.toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        at <strong>{item.bestRetailer}</strong>
                      </div>
                    </td>

                    <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                      {item.lowestUnitPrice ? (
                        <div className="font-mono" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {item.lowestUnitPrice}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-subtle)" }}>—</span>
                      )}
                      {item.hasDifferentPackSizes && (
                        <div style={{ fontSize: "0.68rem", color: "var(--amber)" }}>
                          Packs differ
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                      {item.maxSavingsPercent > 0 ? (
                        <div>
                          <span className="badge badge-lime font-mono" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.72rem" }}>
                            Save {item.maxSavingsPercent}%
                          </span>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            vs highest store
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>Uniform price</span>
                      )}
                    </td>

                    <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", maxWidth: "200px" }}>
                        {item.offers.map((o) => (
                          <span
                            key={o.id}
                            className={`badge ${o.isBestOffer ? "badge-lime" : "badge-subtle"} font-sans`}
                            style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}
                            title={`${o.retailer}: $${o.currentPrice} (${o.channel})`}
                          >
                            {o.retailer}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: "1rem 1.15rem", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-secondary font-sans"
                        onClick={() => onInspectProduct(rawProduct)}
                        style={{ borderRadius: "var(--radius-pill)", padding: "0.35rem 0.75rem", fontSize: "0.775rem", marginRight: "0.4rem" }}
                      >
                        Inspect
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary font-sans"
                        onClick={() => onCompareProduct(item)}
                        style={{
                          borderRadius: "var(--radius-pill)",
                          padding: "0.35rem 0.85rem",
                          fontSize: "0.775rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontWeight: 700
                        }}
                      >
                        <span>Compare ({item.offers.length})</span>
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3 Bottom Sheets */}
      <StoreFilterSheet
        isOpen={isStoreSheetOpen}
        onClose={() => setIsStoreSheetOpen(false)}
        selectedRetailers={selectedRetailers}
        onToggleRetailer={handleToggleRetailer}
        onSelectAll={() => setSelectedRetailers([])}
        onClearAll={() => setSelectedRetailers([])}
        counts={retailerCounts}
      />

      <CategoryFilterSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSelectAll={() => setSelectedCategories([])}
        onClearAll={() => setSelectedCategories([])}
        counts={categoryCounts}
      />

      <FilterOptionsSheet
        isOpen={isOptionsSheetOpen}
        onClose={() => setIsOptionsSheetOpen(false)}
        discountedOnly={discountedOnly}
        onDiscountedOnlyChange={setDiscountedOnly}
        priceDropsOnly={priceDropsOnly}
        onPriceDropsOnlyChange={setPriceDropsOnly}
        minDiscountPercent={minDiscountPercent}
        onMinDiscountPercentChange={setMinDiscountPercent}
        zipCode={zipCode}
        onZipCodeChange={setZipCode}
        onReset={handleResetAdvanced}
      />
    </div>
  );
};
