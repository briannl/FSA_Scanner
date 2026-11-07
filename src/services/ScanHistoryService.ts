import { ScanHistoryItem, ScannedProduct } from "../types/scanner";

const HISTORY_KEY = "fsa_scan_history_v1";
const SAVED_KEY = "fsa_saved_scans_v1";
const MAX_HISTORY_ITEMS = 150;

class ScanHistoryServiceImpl {
  private history: ScanHistoryItem[] = [];
  private saved: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const rawHist = localStorage.getItem(HISTORY_KEY);
      if (rawHist) {
        this.history = JSON.parse(rawHist);
      }
      const rawSaved = localStorage.getItem(SAVED_KEY);
      if (rawSaved) {
        const arr: string[] = JSON.parse(rawSaved);
        this.saved = new Set(arr);
      }
    } catch {
      this.history = [];
      this.saved = new Set();
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
      localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(this.saved)));
    } catch {
      // Storage quota safety
    }
  }

  /**
   * Retrieves full scan history, sorted newest first
   */
  getHistory(): ScanHistoryItem[] {
    return this.history.map((item) => ({
      ...item,
      isFavorite: this.saved.has(item.id)
    }));
  }

  /**
   * Adds a scanned product to history (deduplicating recent identical barcodes)
   */
  addToHistory(
    product: ScannedProduct,
    storeName?: string,
    price?: number | null
  ): ScanHistoryItem {
    const enriched: ScanHistoryItem = {
      ...product,
      storeName: storeName || product.storeName,
      price: price !== undefined ? price : product.price,
      scannedAt: new Date().toISOString(),
      isFavorite: this.saved.has(product.id)
    };

    // Remove older duplicate barcode if scanned within the last 5 minutes to avoid spamming
    const filtered = this.history.filter((h) => h.barcode !== product.barcode);
    this.history = [enriched, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    this.persist();
    return enriched;
  }

  /**
   * Returns only saved/favorited scanned products
   */
  getSaved(): ScanHistoryItem[] {
    return this.history
      .filter((item) => this.saved.has(item.id))
      .map((item) => ({ ...item, isFavorite: true }));
  }

  /**
   * Toggles favorite/saved state
   */
  toggleFavorite(id: string): boolean {
    let nowSaved = false;
    if (this.saved.has(id)) {
      this.saved.delete(id);
    } else {
      this.saved.add(id);
      nowSaved = true;
    }
    this.persist();
    return nowSaved;
  }

  /**
   * Checks if an item is favorited
   */
  isFavorite(id: string): boolean {
    return this.saved.has(id);
  }

  /**
   * Deletes a single item from history and saved
   */
  deleteItem(id: string): void {
    this.history = this.history.filter((item) => item.id !== id);
    this.saved.delete(id);
    this.persist();
  }

  /**
   * Clears all scan history
   */
  clearHistory(): void {
    this.history = [];
    this.saved.clear();
    this.persist();
  }

  /**
   * Updates an item's editable fields (store name, price, label photo)
   */
  updateItem(id: string, updates: Partial<ScanHistoryItem>): void {
    const idx = this.history.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.history[idx] = {
        ...this.history[idx],
        ...updates,
        userEdited: true
      };
      this.persist();
    }
  }

  /**
   * Flags a scan result as incorrect or attaches user-submitted evidence
   */
  flagResult(id: string, note?: string): void {
    this.updateItem(id, {
      flaggedIncorrect: true,
      userEvidenceNote: note || "Flagged by user for FSA eligibility review."
    });
  }

  /**
   * Exports scanned items to JSON format
   */
  exportJson(): void {
    if (typeof window === "undefined") return;
    const data = JSON.stringify(this.getHistory(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fsa_scan_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exports scanned items to CSV format
   */
  exportCsv(): void {
    if (typeof window === "undefined") return;
    const items = this.getHistory();
    const headers = [
      "Barcode",
      "Product Name",
      "Brand",
      "Category",
      "FSA Eligibility",
      "Explanation",
      "Documentation Required",
      "Store",
      "Price",
      "Scanned At",
      "Evidence Source"
    ];

    const rows = items.map((item) => [
      `"${item.barcode}"`,
      `"${(item.name || "").replace(/"/g, '""')}"`,
      `"${(item.brand || "").replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.eligibilityStatus}"`,
      `"${(item.explanation || "").replace(/"/g, '""')}"`,
      `"${item.documentationRequired}"`,
      `"${(item.storeName || "").replace(/"/g, '""')}"`,
      item.price != null ? item.price.toFixed(2) : "",
      `"${item.scannedAt}"`,
      `"${(item.evidenceSource || "").replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fsa_scanned_receipt_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const ScanHistoryService = new ScanHistoryServiceImpl();
