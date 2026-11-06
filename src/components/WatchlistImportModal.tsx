import React, { useState } from "react";
import { ProductObservation } from "../types/product";
import {
  X,
  Plus,
  FileText,
  Bookmark,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";

interface WatchlistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: ProductObservation[]) => void;
  onAddWatchlistUrl: (url: string) => void;
  watchlistUrls: string[];
}

export const WatchlistImportModal: React.FC<WatchlistImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  onAddWatchlistUrl,
  watchlistUrls
}) => {
  const [activeTab, setActiveTab] = useState<"watchlist" | "paste" | "bookmarklet">("watchlist");
  const [newUrl, setNewUrl] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    try {
      const parsed = new URL(newUrl.trim());
      if (!parsed.hostname.includes("cvs.com") && !parsed.hostname.includes("costco.com")) {
        setParseError("URL must be from cvs.com or costco.com");
        return;
      }
      onAddWatchlistUrl(newUrl.trim());
      setNewUrl("");
      setParseError(null);
    } catch {
      setParseError("Please enter a valid URL (including https://)");
    }
  };

  const handleImportData = () => {
    setParseError(null);
    if (!pasteData.trim()) {
      setParseError("Please paste valid JSON or CSV data");
      return;
    }

    try {
      // Try JSON first
      const trimmed = pasteData.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        const validProducts: ProductObservation[] = list.map((item, idx) => {
          if (!item.name || !item.retailer) {
            throw new Error(`Item ${idx + 1} is missing required fields (name, retailer)`);
          }
          const retailer = item.retailer === "Costco" ? "Costco" : "CVS";
          const currentPrice = typeof item.currentPrice === "number" ? item.currentPrice : (parseFloat(item.currentPrice) || null);
          const regularPrice = typeof item.regularPrice === "number" ? item.regularPrice : (parseFloat(item.regularPrice) || null);
          const discountAmount = regularPrice && currentPrice && regularPrice > currentPrice ? +(regularPrice - currentPrice).toFixed(2) : 0;
          const discountPercent = regularPrice && currentPrice && regularPrice > currentPrice ? +(((regularPrice - currentPrice) / regularPrice) * 100).toFixed(1) : 0;

          return {
            id: item.id || `${retailer.toLowerCase()}-${Date.now()}-${idx}`,
            retailer,
            name: String(item.name).trim(),
            category: item.category || "General Health",
            currentPrice,
            regularPrice,
            unitPrice: item.unitPrice || null,
            size: item.size || null,
            discountAmount: item.discountAmount ?? discountAmount,
            discountPercent: item.discountPercent ?? discountPercent,
            promoType: item.promoType || (discountAmount > 0 ? "Standard Markdown" : "None"),
            promoDetails: item.promoDetails || null,
            fsaEligible: item.fsaEligible ?? true,
            priceStatus: item.priceStatus || (currentPrice !== null ? "confirmed" : "uncertain"),
            isRecentDrop: Boolean(item.isRecentDrop),
            lowestHistoricalPrice: currentPrice,
            imageUrl: item.imageUrl || null,
            productUrl: item.productUrl || "https://www.cvs.com",
            sourceType: "manual-import",
            observedAt: new Date().toISOString()
          };
        });

        onImportProducts(validProducts);
        setPasteData("");
        onClose();
        return;
      }

      // If not JSON, try simple CSV
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const products: ProductObservation[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = cols[idx] || "";
          });

          const retailer = row.retailer?.toLowerCase().includes("costco") ? "Costco" : "CVS";
          const currentPrice = parseFloat(row.currentprice || row.price) || null;
          const regularPrice = parseFloat(row.regularprice) || null;
          const discountAmount = regularPrice && currentPrice && regularPrice > currentPrice ? +(regularPrice - currentPrice).toFixed(2) : 0;
          const discountPercent = regularPrice && currentPrice && regularPrice > currentPrice ? +(((regularPrice - currentPrice) / regularPrice) * 100).toFixed(1) : 0;

          products.push({
            id: row.id || `${retailer.toLowerCase()}-${Date.now()}-${i}`,
            retailer,
            name: row.name || `Imported Item ${i}`,
            category: row.category || "OTC Meds",
            currentPrice,
            regularPrice,
            unitPrice: row.unitprice || null,
            size: row.size || null,
            discountAmount,
            discountPercent,
            promoType: (row.promotype as any) || (discountAmount > 0 ? "Standard Markdown" : "None"),
            promoDetails: row.promodetails || null,
            fsaEligible: true,
            priceStatus: currentPrice !== null ? "confirmed" : "uncertain",
            isRecentDrop: false,
            lowestHistoricalPrice: currentPrice,
            imageUrl: null,
            productUrl: row.producturl || "https://www.cvs.com",
            sourceType: "manual-import",
            observedAt: new Date().toISOString()
          });
        }

        onImportProducts(products);
        setPasteData("");
        onClose();
        return;
      }

      setParseError("Unrecognized format. Please provide valid JSON array or CSV.");
    } catch (err: any) {
      setParseError(`Import Error: ${err.message}`);
    }
  };

  const bookmarkletCode = `javascript:(function(){
    const isCVS = window.location.hostname.includes('cvs.com');
    const isCostco = window.location.hostname.includes('costco.com');
    if(!isCVS && !isCostco){ alert('Run this bookmarklet on a CVS or Costco product page!'); return; }
    
    let name = document.querySelector('h1')?.innerText?.trim() || document.title;
    let priceText = document.querySelector('[data-testid="product-price"], .price, .product-price, .your-price')?.innerText || '';
    let regPriceText = document.querySelector('.regular-price, .was-price, .strike-price')?.innerText || '';
    
    let parseP = (t) => {
      let m = (t||'').match(/\\$([0-9]+(?:\\.[0-9]{2})?)/);
      return m ? parseFloat(m[1]) : null;
    };
    
    let currentPrice = parseP(priceText);
    let regularPrice = parseP(regPriceText) || currentPrice;
    
    const observation = {
      id: (isCostco ? 'costco-' : 'cvs-') + (window.location.pathname.match(/(\\d+)/)?.[1] || Date.now()),
      retailer: isCostco ? 'Costco' : 'CVS',
      name: name,
      category: 'OTC Meds',
      currentPrice: currentPrice,
      regularPrice: regularPrice,
      fsaEligible: true,
      priceStatus: currentPrice ? 'confirmed' : 'uncertain',
      productUrl: window.location.href,
      sourceType: 'manual-import',
      observedAt: new Date().toISOString()
    };
    
    navigator.clipboard.writeText(JSON.stringify(observation, null, 2)).then(()=>{
      alert('Copied product observation to clipboard! You can now paste it into Personal FSA Deal Tracker.');
    });
  })();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bookmark size={20} style={{ color: "var(--primary)" }} />
            <h2 id="modal-title" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Watchlist & Data Import Center
            </h2>
          </div>
          <button className="btn btn-secondary" onClick={onClose} aria-label="Close modal" style={{ padding: "0.3rem" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
          <button
            className={`segment-btn ${activeTab === "watchlist" ? "active" : ""}`}
            style={{ flex: 1, padding: "0.6rem", borderRadius: 0 }}
            onClick={() => setActiveTab("watchlist")}
          >
            URL Watchlist ({watchlistUrls.length})
          </button>
          <button
            className={`segment-btn ${activeTab === "paste" ? "active" : ""}`}
            style={{ flex: 1, padding: "0.6rem", borderRadius: 0 }}
            onClick={() => setActiveTab("paste")}
          >
            Import JSON / CSV
          </button>
          <button
            className={`segment-btn ${activeTab === "bookmarklet" ? "active" : ""}`}
            style={{ flex: 1, padding: "0.6rem", borderRadius: 0 }}
            onClick={() => setActiveTab("bookmarklet")}
          >
            Browser Bookmarklet
          </button>
        </div>

        <div className="modal-body">
          {parseError && (
            <div className="alert-banner" style={{ margin: 0 }}>
              <AlertCircle size={16} />
              <span>{parseError}</span>
            </div>
          )}

          {activeTab === "watchlist" && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
                Add exact CVS or Costco product URLs to your recurring tracker watchlist. The background collector checks these pages for price drops and FSA eligibility.
              </p>

              <form onSubmit={handleAddUrl} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="url"
                  className="search-input"
                  style={{ flex: 1, padding: "0.5rem 0.75rem" }}
                  placeholder="https://www.cvs.com/shop/... or https://www.costco.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Add URL
                </button>
              </form>

              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                {watchlistUrls.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No custom watchlist URLs added yet. Default seed catalog is active.
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {watchlistUrls.map((url, i) => (
                      <li
                        key={i}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderBottom: "1px solid var(--border-light)",
                          fontSize: "0.8rem",
                          wordBreak: "break-all"
                        }}
                      >
                        {url}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === "paste" && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                Paste JSON (array of product objects) or standard CSV format with headers (<code>retailer, name, currentPrice, regularPrice, category</code>).
              </p>

              <textarea
                rows={7}
                className="search-input"
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem", padding: "0.6rem" }}
                placeholder='[{"retailer":"Costco","name":"Kirkland Aller-Tec","currentPrice":11.49,"regularPrice":14.99,"category":"OTC Meds"}]'
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <button className="btn btn-primary" onClick={handleImportData}>
                  <FileText size={16} /> Parse & Import
                </button>
              </div>
            </div>
          )}

          {activeTab === "bookmarklet" && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                Costco & CVS use Akamai bot protection that occasionally blocks AWS/Netlify datacenter IPs. Drag or copy this bookmarklet to your browser toolbar to extract deals directly from your logged-in browser tab:
              </p>

              <div className="code-box">
                {bookmarkletCode}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
                  Instructions: Create a browser bookmark, paste this as the URL, and click it on any product page.
                </span>
                <button className="btn btn-secondary" onClick={copyBookmarklet}>
                  {copiedBookmarklet ? <Check size={16} style={{ color: "var(--success)" }} /> : <Copy size={16} />}
                  {copiedBookmarklet ? "Copied!" : "Copy Bookmarklet Code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
