import React, { useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
  GridReadyEvent,
  GridApi,
  RowSelectedEvent
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ProductObservation } from "../types/product";
import {
  ExternalLink,
  TrendingDown,
  Award,
  LineChart,
  HelpCircle
} from "lucide-react";

// Register Community Modules for AG Grid Community v33+
ModuleRegistry.registerModules([AllCommunityModule]);

interface ProductGridProps {
  products: ProductObservation[];
  quickFilterText: string;
  onSelectProduct: (product: ProductObservation) => void;
  onGridReadyExportHook?: (exportCsvFn: () => void) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  quickFilterText,
  onSelectProduct,
  onGridReadyExportHook
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

  const columnDefs = useMemo<ColDef<ProductObservation>[]>(() => {
    return [
      {
        headerName: "Retailer",
        field: "retailer",
        width: 105,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const val = params.value as "CVS" | "Costco";
          return (
            <span className={`retailer-pill ${val ? val.toLowerCase() : ""}`}>
              {val}
            </span>
          );
        }
      },
      {
        headerName: "Product Name & Category",
        field: "name",
        minWidth: 320,
        flex: 2,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
              <span className="product-cell-name" title={item.name}>
                {item.name}
              </span>
              <span className="product-category-tag">{item.category}</span>
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open product page on retailer website"
                style={{ color: "var(--primary)", display: "inline-flex", marginLeft: "auto", padding: "2px" }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          );
        }
      },
      {
        headerName: "Current Price",
        field: "currentPrice",
        width: 130,
        sortable: true,
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
              <span className="price-uncertain" title="Price depends on local inventory/login">
                <HelpCircle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                Uncertain
              </span>
            );
          }

          return (
            <div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                ${item.currentPrice.toFixed(2)}
              </span>
              {item.regularPrice && item.regularPrice > item.currentPrice && (
                <span className="price-strike">${item.regularPrice.toFixed(2)}</span>
              )}
            </div>
          );
        }
      },
      {
        headerName: "Discount %",
        field: "discountPercent",
        width: 120,
        sort: "desc", // Default sort: discount % descending
        sortable: true,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const val = params.value as number;
          if (!val || val <= 0) return <span style={{ color: "var(--text-muted)" }}>—</span>;
          return <span className="discount-pill">-{val.toFixed(1)}%</span>;
        }
      },
      {
        headerName: "Savings",
        field: "discountAmount",
        width: 110,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const val = params.value as number;
          if (!val || val <= 0) return <span style={{ color: "var(--text-muted)" }}>—</span>;
          return (
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              -${val.toFixed(2)}
            </span>
          );
        }
      },
      {
        headerName: "Unit Price",
        field: "unitPrice",
        width: 125,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          return (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {item?.unitPrice || item?.size || "—"}
            </span>
          );
        }
      },
      {
        headerName: "Promo Type & Details",
        field: "promoType",
        minWidth: 220,
        flex: 1,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          let badgeClass = "badge-none";
          if (item.promoType === "Standard Markdown") badgeClass = "badge-markdown";
          else if (item.promoType === "Costco Instant Savings") badgeClass = "badge-instant";
          else if (item.promoType === "CVS Promo") badgeClass = "badge-cvspromo";
          else if (item.promoType === "Multi-Buy") badgeClass = "badge-multibuy";
          else if (item.promoType === "Coupon Only") badgeClass = "badge-coupon";

          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
              <span className={`badge-promo ${badgeClass}`}>{item.promoType}</span>
              {item.promoDetails && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                  title={item.promoDetails}
                >
                  {item.promoDetails}
                </span>
              )}
            </div>
          );
        }
      },
      {
        headerName: "Signals",
        width: 160,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          if (!item) return null;

          const isLowest =
            item.lowestHistoricalPrice !== null &&
            item.currentPrice !== null &&
            item.currentPrice <= item.lowestHistoricalPrice;

          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {item.isRecentDrop && (
                <span className="badge-drop" title="Price decreased in the latest observation">
                  <TrendingDown size={11} /> Drop
                </span>
              )}
              {isLowest && (
                <span className="badge-low" title="At or below all-time lowest recorded price!">
                  <Award size={11} /> All-Time Low
                </span>
              )}
              {!item.isRecentDrop && !isLowest && (
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Normal</span>
              )}
            </div>
          );
        }
      },
      {
        headerName: "Action",
        width: 105,
        cellRenderer: (params: ICellRendererParams<ProductObservation>) => {
          const item = params.data;
          return (
            <button
              className="btn btn-secondary"
              style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => item && onSelectProduct(item)}
            >
              <LineChart size={13} /> Chart
            </button>
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
    <div className="grid-container-wrapper">
      <div className="grid-wrapper ag-theme-quartz">
        <AgGridReact<ProductObservation>
          theme="legacy"
          rowData={products}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          rowSelection={{ mode: "singleRow", enableClickSelection: true }}
          onRowSelected={onRowSelected}
          onGridReady={onGridReady}
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
