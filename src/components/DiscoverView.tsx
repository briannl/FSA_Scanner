import React, { useState, useMemo } from "react";
import { ProductObservation, Retailer, RETAILER_REGISTRY } from "../types/product";
import { FSAFEDS_CATEGORIES, FsafedsCategory } from "../types/fsafeds";
import {
  GroupedProduct,
  groupProductsAcrossRetailers,
  parseUnitPriceValue
} from "../services/productMatcher";
import { findNearbyStores } from "../services/storeLocator";
import {
  Search,
  MapPin,
  ArrowUpDown,
  CheckCircle,
  ChevronRight
} from "lucide-react";

interface DiscoverViewProps {
  products: ProductObservation[];
  onInspectProduct: (product: ProductObservation) => void;
  onCompareProduct: (grouped: GroupedProduct) => void;
  isMobile?: boolean;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  products,
  onInspectProduct,
  onCompareProduct,
  isMobile = false
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState<"All" | Retailer>("All");
  const [selectedCategory, setSelectedCategory] = useState<"All" | FsafedsCategory>("All");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "savings_desc" | "price_asc" | "price_desc" | "unit_price" | "offers_count"
  >("savings_desc");
  const [zipCode, setZipCode] = useState("90210");
  const [showNearbyStores, setShowNearbyStores] = useState(false);

  // Grouped products cross-retailers
  const allGrouped = useMemo(() => groupProductsAcrossRetailers(products), [products]);

  // Nearby stores based on configured ZIP
  const nearbyStores = useMemo(() => findNearbyStores(zipCode), [zipCode]);

  // Filtered grouped products
  const filteredProducts = useMemo(() => {
    return allGrouped.filter((item) => {
      // 1. Text search
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesOffers = item.offers.some((o) => o.retailer.toLowerCase().includes(query));
        if (!matchesName && !matchesBrand && !matchesCat && !matchesOffers) return false;
      }

      // 2. Retailer filter
      if (selectedRetailer !== "All") {
        const hasRetailer = item.offers.some((o) => o.retailer === selectedRetailer);
        if (!hasRetailer) return false;
      }

      // 3. Category filter
      if (selectedCategory !== "All") {
        if (item.category !== selectedCategory) return false;
      }

      // 4. Discount only
      if (discountOnly) {
        const hasDiscount = item.offers.some((o) => o.discountAmount > 0 || o.discountPercent > 0);
        if (!hasDiscount) return false;
      }

      return true;
    });
  }, [allGrouped, searchText, selectedRetailer, selectedCategory, discountOnly]);

  // Sorted grouped products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === "price_asc") {
        return (a.lowestPrice || 0) - (b.lowestPrice || 0);
      }
      if (sortBy === "price_desc") {
        return (b.lowestPrice || 0) - (a.lowestPrice || 0);
      }
      if (sortBy === "unit_price") {
        const uA = parseUnitPriceValue(a.lowestUnitPrice) || Infinity;
        const uB = parseUnitPriceValue(b.lowestUnitPrice) || Infinity;
        return uA - uB;
      }
      if (sortBy === "offers_count") {
        return b.offers.length - a.offers.length;
      }
      // Default: savings_desc
      return b.maxSavingsPercent - a.maxSavingsPercent;
    });
  }, [filteredProducts, sortBy]);

  const allRetailers: Retailer[] = [
    "Costco",
    "CVS",
    "Amazon",
    "Ralphs",
    "Vons",
    "Instacart",
    "Smart & Final",
    "H Mart",
    "99 Ranch",
    "Trader Joe's"
  ];

  return (
    <div className="discover-container" style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 1.25rem 2rem 1.25rem" }}>
      {/* Top Discover Bar: Search, ZIP Code, Toggles */}
      <div
        className="discover-filter-card"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.15rem 1.35rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }}
            />
            <input
              type="text"
              className="pill-input font-sans"
              placeholder="Search multi-store products, brands, active ingredients..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.5rem" }}
            />
          </div>

          {/* Configurable ZIP Code Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "0.25rem 0.75rem",
                fontSize: "0.825rem",
                color: "var(--text-main)"
              }}
            >
              <MapPin size={14} style={{ color: "var(--lavender)" }} />
              <span style={{ fontWeight: 600 }}>ZIP:</span>
              <input
                type="text"
                className="font-mono"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "55px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-main)",
                  fontWeight: 700
                }}
              />
              <button
                type="button"
                onClick={() => setShowNearbyStores(!showNearbyStores)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--lavender)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.1rem 0.35rem",
                  borderRadius: "var(--radius-pill)"
                }}
              >
                {showNearbyStores ? "Hide Stores" : `${nearbyStores.length} Stores`}
              </button>
            </div>
          </div>

          {/* Sort Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ArrowUpDown size={14} style={{ color: "var(--text-subtle)" }} />
            <select
              className="pill-select font-sans"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "0.45rem 0.85rem",
                fontSize: "0.825rem",
                color: "var(--text-main)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="savings_desc">Highest % Savings</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="unit_price">Unit Price: Low to High</option>
              <option value="offers_count">Most Store Offers</option>
            </select>
          </div>

          {/* On Sale Only Switch */}
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", fontSize: "0.825rem" }}>
            <input
              type="checkbox"
              checked={discountOnly}
              onChange={(e) => setDiscountOnly(e.target.checked)}
              style={{ accentColor: "var(--lime)" }}
            />
            <span style={{ fontWeight: 600 }}>Discounted Only</span>
          </label>
        </div>

        {/* Expandable Nearby Stores Ribbon */}
        {showNearbyStores && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem"
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Physical Participating Stores Near ZIP {zipCode}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
              {nearbyStores.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.775rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
                    <span>{s.name}</span>
                    <span className="font-mono text-lime" style={{ fontSize: "0.7rem" }}>{s.distanceMiles} mi</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.725rem", marginTop: "0.15rem" }}>
                    {s.address}, {s.city}
                  </div>
                  <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.3rem" }}>
                    {s.fulfillmentMethods.map((m) => (
                      <span key={m} className="badge badge-subtle font-sans" style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retailer Chips Filter */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "0.25rem" }}>
            Stores:
          </span>
          <button
            type="button"
            className={`pill-tab ${selectedRetailer === "All" ? "active" : ""}`}
            onClick={() => setSelectedRetailer("All")}
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.775rem" }}
          >
            All Stores ({allRetailers.length})
          </button>
          {allRetailers.map((r) => {
            const count = allGrouped.filter((g) => g.offers.some((o) => o.retailer === r)).length;
            const meta = RETAILER_REGISTRY[r];
            return (
              <button
                key={r}
                type="button"
                className={`pill-tab ${selectedRetailer === r ? "active" : ""}`}
                onClick={() => setSelectedRetailer(selectedRetailer === r ? "All" : r)}
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.775rem" }}
                title={`${meta.description} (Capability: ${meta.capability})`}
              >
                {r} <span style={{ opacity: 0.65, fontSize: "0.7rem", marginLeft: "2px" }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* FSAFEDS 12 Categories Filter Pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "0.25rem" }}>
            FSAFEDS Categories:
          </span>
          <button
            type="button"
            className={`pill-tab ${selectedCategory === "All" ? "active" : ""}`}
            onClick={() => setSelectedCategory("All")}
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.775rem" }}
          >
            All Categories
          </button>
          {FSAFEDS_CATEGORIES.map((cat) => {
            const count = allGrouped.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`pill-tab ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "All" : cat)}
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.775rem" }}
              >
                {cat} {count > 0 && <span style={{ opacity: 0.65, fontSize: "0.7rem" }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Strict Eligibility Callout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Showing <strong>{sortedProducts.length}</strong> verified FSAFEDS physical health products
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-subtle)" }}>
          <CheckCircle size={14} style={{ color: "var(--lime)" }} />
          <span>Strict FSAFEDS & IRS 213(d) Physical Products Only (No general grocery or cosmetics)</span>
        </div>
      </div>

      {/* View: Mobile Cards or Desktop Table */}
      {isMobile ? (
        // Mobile Cards
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {sortedProducts.map((item) => {
            const rawProduct = products.find((p) => p.name === item.name) || products[0];
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                      <span className="badge badge-lavender font-sans" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}>
                        {item.category}
                      </span>
                      {item.isMultiStore && (
                        <span className="badge badge-lime font-sans" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.68rem" }}>
                          {item.offers.length} Stores Available
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                      {item.name}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      Brand: {item.brand}
                    </div>
                  </div>
                </div>

                {/* Best Offer & Unit Price */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.65rem 0.85rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Lowest Price at <strong>{item.bestRetailer}</strong>
                    </div>
                    <div className="font-mono text-lime" style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                      ${item.lowestPrice?.toFixed(2)}
                    </div>
                  </div>

                  {item.lowestUnitPrice && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Best Unit Price</div>
                      <div className="font-mono" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                        {item.lowestUnitPrice}
                      </div>
                    </div>
                  )}
                </div>

                {/* Different pack sizes alert */}
                {item.hasDifferentPackSizes && (
                  <div style={{ fontSize: "0.72rem", color: "var(--amber)" }}>
                    * Pack sizes differ across stores. Compare unit price.
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary font-sans"
                    onClick={() => onInspectProduct(rawProduct)}
                    style={{ flex: 1, borderRadius: "var(--radius-pill)", padding: "0.5rem", fontSize: "0.8rem" }}
                  >
                    Inspect
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary font-sans"
                    onClick={() => onCompareProduct(item)}
                    style={{
                      flex: 1.5,
                      borderRadius: "var(--radius-pill)",
                      padding: "0.5rem",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span>Compare ({item.offers.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Desktop Table View
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
                    {/* Title & Category */}
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

                    {/* Best Price */}
                    <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                      <div className="font-mono text-lime" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                        ${item.lowestPrice?.toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        at <strong>{item.bestRetailer}</strong>
                      </div>
                    </td>

                    {/* Unit Price */}
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

                    {/* Cross-Store Spread */}
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

                    {/* Store Offers */}
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

                    {/* Actions */}
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
                          gap: "0.25rem"
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
    </div>
  );
};
