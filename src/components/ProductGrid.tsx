import React, { useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
  GridReadyEvent,
  GridApi,
  RowSelectedEvent,
  themeQuartz
} from "ag-grid-community";
import { ProductObservation } from "../types/product";
import {
  ExternalLink,
  TrendingDown,
  Award,
  LineChart,
  HelpCircle,
  CheckCircle2,
  Package,
  Activity,
  HeartPulse,
  Sun,
  Eye,
  Bandage
} from "lucide-react";

// Register Community Modules for AG Grid Community v33+
ModuleRegistry.registerModules([AllCommunityModule]);

// Customized Quartz Themes for Fintech Light & Dark Terminals
const lightGridTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  foregroundColor: "#0f172a",
  headerBackgroundColor: "#f8fafc",
  headerTextColor: "#475569",
  borderColor: "#e2e8f0",
  rowHoverColor: "#f8fafc",
  accentColor: "#0284c7",
  fontSize: 13,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const darkGridTheme = themeQuartz.withParams({
  backgroundColor: "#0f172a",
  foregroundColor: "#f8fafc",
  headerBackgroundColor: "#1e293b",
  headerTextColor: "#94a3b8",
  borderColor: "#1e293b",
  rowHoverColor: "#1e293b",
  accentColor: "#38bdf8",
  fontSize: 13,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

interface ProductGridProps {
  products: ProductObservation[];
  quickFilterText: string;
  onSelectProduct: (product: ProductObservation) => void;
  onGridReadyExportHook?: (exportCsvFn: () => void) => void;
  isDarkMode?: boolean;
}

// Category fallback icon helper
const renderCategoryFallbackIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("diag") || cat.includes("blood") || cat.includes("pressure")) {
    return <Activity size={18} />;
  }
  if (cat.includes("first aid") || cat.includes("wound") || cat.includes("bandage")) {
    return <Bandage size={18} />;
  }
  if (cat.includes("sun")) {
    return <Sun size={18} />;
  }
  if (cat.includes("vision") || cat.includes("eye")) {
    return <Eye size={18} />;
  }
  if (cat.includes("otc") || cat.includes("med")) {
    return <HeartPulse size={18} />;
  }
  return <Package size={18} />;
};

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  quickFilterText,
  onSelectProduct,
  onGridReadyExportHook,
  isDarkMode = false
}) => {
  const gridApiRef = useRef<GridApi<ProductObservation> | null>(null);

  const exportFilteredCsv = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        fileName: `fsa_deals_${new Date().toISOString().slice(0, 10)}.csv`,
        columnKeys: [
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
        ]
      });
    }
  }, []);

  const onGridReady = useCallback(
    (params: GridReadyEvent<ProductObservation>) => {
      gridApiRef.current = params.api;
      if (onGridReadyExportHook) {
        onGridReadyExportHook(exportFilteredCsv);
      }
    },
    [onGridReadyExportHook, exportFilteredCsv]
  );

  // 6 High-Signal Composite Columns
  const columnDefs = useMemo<ColDef<ProductObservation>[]>(() => {
    return [
      // 1. PRODUCT (Pinned Left, minWidth 320px)
      {
        headerName: "Product",
        field: "name",
        pinned: "left",
        minWidth: 340,
        flex: 2,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          return (
            <div className="product-composite-cell">
              <div className="product-thumb-box" title={item.category}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="product-thumb-img"
                    onError={(e) => {
                      // Fallback on broken image load
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  renderCategoryFallbackIcon(item.category)
                )}
              </div>

              <div className="product-info-stack">
                <div className="product-title-line" title={item.name}>
                  {item.name}
                </div>
                <div className="product-meta-subline">
                  <span className={`retailer-pill ${item.retailer.toLowerCase()}`}>
                    {item.retailer}
                  </span>
                  <span>•</span>
                  <span>{item.size || item.category}</span>
                  {item.fsaEligible && (
                    <>
                      <span>•</span>
                      <span className="fsa-check-badge">
                        <CheckCircle2 size={11} /> FSA
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        }
      },

      // 2. PRICE & REFERENCE (width 150px, right-aligned)
      {
        headerName: "Price & Reference",
        field: "currentPrice",
        width: 155,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        comparator: (a: number | null, b: number | null) => {
          if (a === null) return 1;
          if (b === null) return -1;
          return a - b;
        },
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          if (item.priceStatus === "uncertain" || item.currentPrice === null) {
            return (
              <div className="price-composite-cell">
                <span className="price-uncertain-badge" title="Price varies by store or inventory level">
                  <HelpCircle size={11} /> Uncertain
                </span>
              </div>
            );
          }

          return (
            <div className="price-composite-cell">
              <div className="price-main-row font-mono">
                <span className="price-current-bold">${item.currentPrice.toFixed(2)}</span>
                {item.regularPrice && item.regularPrice > item.currentPrice && (
                  <span className="price-regular-strike">${item.regularPrice.toFixed(2)}</span>
                )}
              </div>
              {item.unitPrice && (
                <div className="price-unit-subline font-mono">{item.unitPrice}</div>
              )}
            </div>
          );
        }
      },

      // 3. SAVINGS (width 140px, default sort descending)
      {
        headerName: "Savings",
        field: "discountPercent",
        width: 140,
        sort: "desc", // Default sort: highest discount first
        sortable: true,
        comparator: (a: number, b: number) => (a || 0) - (b || 0),
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item || !item.discountPercent || item.discountPercent <= 0) {
            return <div className="savings-composite-cell"><span style={{ color: "var(--text-subtle)" }}>—</span></div>;
          }

          return (
            <div className="savings-composite-cell">
              <span className="savings-badge-pill font-mono">
                -{item.discountPercent.toFixed(1)}%
              </span>
              {item.discountAmount > 0 && (
                <span className="savings-dollar-subline font-mono">
                  Save ${item.discountAmount.toFixed(2)}
                </span>
              )}
            </div>
          );
        }
      },

      // 4. PROMOTION TYPE (width 180px)
      {
        headerName: "Promotion Type",
        field: "promoType",
        width: 185,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          let badgeClass = "none";
          if (item.promoType === "Costco Instant Savings") badgeClass = "instant";
          else if (item.promoType === "Standard Markdown") badgeClass = "markdown";
          else if (item.promoType === "CVS Promo") badgeClass = "cvs";
          else if (item.promoType === "Multi-Buy") badgeClass = "multibuy";
          else if (item.promoType === "Coupon Only") badgeClass = "coupon";

          return (
            <div className="promo-type-cell">
              <span className={`promo-semantic-badge ${badgeClass}`}>
                {item.promoType}
              </span>
              {item.promoDetails && (
                <span className="promo-details-subline" title={item.promoDetails}>
                  {item.promoDetails}
                </span>
              )}
            </div>
          );
        }
      },

      // 5. PRICE CONTEXT (width 160px)
      {
        headerName: "Price Context",
        width: 165,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          const isLowest =
            item.lowestHistoricalPrice !== null &&
            item.currentPrice !== null &&
            item.currentPrice <= item.lowestHistoricalPrice;

          return (
            <div className="price-context-cell">
              {item.isRecentDrop && (
                <span className="badge-recent-drop" title="Price decreased since last check">
                  <TrendingDown size={12} /> Drop
                </span>
              )}
              {isLowest ? (
                <span className="badge-alltime-low" title="At or below all-time lowest recorded price!">
                  <Award size={12} /> All-Time Low
                </span>
              ) : (
                item.lowestHistoricalPrice &&
                item.currentPrice &&
                item.currentPrice > item.lowestHistoricalPrice && (
                  <span
                    className="badge-above-low font-mono"
                    title={`Lowest historical: $${item.lowestHistoricalPrice.toFixed(2)}`}
                  >
                    +${(item.currentPrice - item.lowestHistoricalPrice).toFixed(2)} from low
                  </span>
                )
              )}
              {!item.isRecentDrop && !isLowest && !item.lowestHistoricalPrice && (
                <span style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>Baseline</span>
              )}
            </div>
          );
        }
      },

      // 6. ACTIONS (Pinned Right, width 110px)
      {
        headerName: "Actions",
        pinned: "right",
        width: 125,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          return (
            <div className="actions-cell-group">
              <button
                type="button"
                className="btn-inspect"
                onClick={() => onSelectProduct(item)}
                title="Inspect price history chart and deal conditions"
              >
                <LineChart size={13} />
                <span>Inspect</span>
              </button>

              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-buy-link"
                title={`Open product page on ${item.retailer}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span>Buy</span>
                <ExternalLink size={11} />
              </a>
            </div>
          );
        }
      }
    ];
  }, [onSelectProduct]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      resizable: true,
      sortable: true
    };
  }, []);

  const onRowSelected = useCallback(
    (event: RowSelectedEvent<ProductObservation>) => {
      if (event.node.isSelected() && event.data) {
        onSelectProduct(event.data);
      }
    },
    [onSelectProduct]
  );

  return (
    <div className="grid-section-container">
      <div className="grid-card-box">
        <AgGridReact<ProductObservation>
          theme={isDarkMode ? darkGridTheme : lightGridTheme}
          rowData={products}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          rowSelection={{ mode: "singleRow", enableClickSelection: true }}
          onRowSelected={onRowSelected}
          onGridReady={onGridReady}
          rowHeight={56}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          domLayout="normal"
        />
      </div>
    </div>
  );
};
