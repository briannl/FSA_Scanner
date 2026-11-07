import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Bookmark,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Building,
  Info,
  Flag
} from "lucide-react";
import { ScannedProduct, InStoreEligibilityStatus } from "../types/scanner";
import { ScanHistoryService } from "../services/ScanHistoryService";

interface ScanResultModalProps {
  product: ScannedProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onScanAnother: () => void;
  onViewMatchingDeal?: (productId: string) => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  product,
  isOpen,
  onClose,
  onScanAnother,
  onViewMatchingDeal
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    return product ? ScanHistoryService.isFavorite(product.id) : false;
  });
  const [storeInput, setStoreInput] = useState(product?.storeName || "");
  const [priceInput, setPriceInput] = useState(
    product?.price != null ? product.price.toString() : ""
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagNote, setFlagNote] = useState(product?.userEvidenceNote || "");
  const [isFlagged, setIsFlagged] = useState(Boolean(product?.flaggedIncorrect));
  const [flagNotice, setFlagNotice] = useState(false);

  if (!isOpen || !product) return null;

  const handleToggleFavorite = () => {
    const nextSaved = ScanHistoryService.toggleFavorite(product.id);
    setIsSaved(nextSaved);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleSaveStoreAndPrice = () => {
    const parsedPrice = priceInput.trim() ? parseFloat(priceInput.replace(/[^0-9.]/g, "")) : null;
    ScanHistoryService.updateItem(product.id, {
      storeName: storeInput.trim() || undefined,
      price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 1500);
  };

  const handleSubmitFlag = () => {
    ScanHistoryService.flagResult(product.id, flagNote.trim());
    setIsFlagged(true);
    setShowFlagInput(false);
    setFlagNotice(true);
    setTimeout(() => setFlagNotice(false), 2500);
  };

  // Status Badge Configuration
  const getStatusBadgeConfig = (status: InStoreEligibilityStatus) => {
    switch (status) {
      case "Verified eligible":
        return {
          bgClass: "badge-status-verified",
          icon: <CheckCircle2 size={24} className="text-emerald-400" />,
          title: "Verified FSA Eligible",
          accentColor: "#A2F1BF"
        };
      case "Likely eligible — verify":
        return {
          bgClass: "badge-status-likely",
          icon: <Info size={24} className="text-blue-400" />,
          title: "Likely Eligible — Verify",
          accentColor: "#93C5FD"
        };
      case "Requires documentation":
        return {
          bgClass: "badge-status-conditional",
          icon: <AlertTriangle size={24} className="text-amber-400" />,
          title: "Requires Documentation (LMN)",
          accentColor: "#FCD34D"
        };
      case "Not eligible":
        return {
          bgClass: "badge-status-ineligible",
          icon: <XCircle size={24} className="text-rose-400" />,
          title: "Not FSA Eligible",
          accentColor: "#FDA4AF"
        };
      case "Unable to verify":
      default:
        return {
          bgClass: "badge-status-unverified",
          icon: <HelpCircle size={24} className="text-slate-300" />,
          title: "Unable to Verify",
          accentColor: "#CBD5E1"
        };
    }
  };

  const statusConfig = getStatusBadgeConfig(product.eligibilityStatus);

  return (
    <div
      className="scanner-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Scan Result Details"
    >
      <div className="scan-result-card">
        {/* Top Dismiss Button */}
        <button
          type="button"
          className="scan-result-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* 1. Large Eligibility Result Banner */}
        <div className={`scan-result-banner ${statusConfig.bgClass}`}>
          <div className="result-banner-icon">{statusConfig.icon}</div>
          <div className="result-banner-text">
            <span className="result-banner-title">{statusConfig.title}</span>
            <span className="result-banner-category">
              {product.medicalCategory ? `${product.medicalCategory} • ${product.category}` : product.category}
            </span>
          </div>
        </div>

        {/* 2. Product Name & Brand */}
        <div className="scan-result-header">
          {product.imageUrl && (
            <div className="scan-result-thumb">
              <img src={product.imageUrl} alt={product.name} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {product.brand && (
              <span className="scan-result-brand">{product.brand}</span>
            )}
            <h2 className="scan-result-name">{product.name}</h2>
            <div className="scan-result-barcode-tag">
              UPC: <code>{product.barcode}</code>
            </div>
          </div>
        </div>

        {/* 2b. Medicated Drug Facts / Active Ingredient Box */}
        {(product.activeIngredient || product.purpose) && (
          <div className="scan-result-drug-facts">
            {product.activeIngredient && (
              <div className="drug-fact-item">
                <span className="drug-fact-label">Active Ingredient:</span>
                <span className="drug-fact-value">{product.activeIngredient}</span>
              </div>
            )}
            {product.purpose && (
              <div className="drug-fact-item">
                <span className="drug-fact-label">Purpose:</span>
                <span className="drug-fact-value">{product.purpose}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Short Clear Explanation */}
        <div className="scan-result-explanation-box">
          <p className="scan-explanation-text">{product.explanation}</p>
        </div>

        {/* 4. Documentation Requirements Banner */}
        <div className="scan-result-doc-box">
          <span className="doc-box-label">Documentation Required:</span>
          <span className="doc-box-value">{product.documentationRequired}</span>
          {product.evidenceUrl && (
            <a
              href={product.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="doc-box-evidence-link"
            >
              Verified FSAFEDS / FSA Store Reference <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* 5. Matching Deal Link (if available in Deals feed) */}
        {product.matchingDeal && (
          <div className="scan-matching-deal-banner">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-lime" />
              <div>
                <span className="text-xs text-muted block">Matching active deal:</span>
                <span className="text-white font-semibold text-sm">
                  ${product.matchingDeal.currentPrice.toFixed(2)} at {product.matchingDeal.retailer}
                  {product.matchingDeal.discountPercent > 0 && ` (${product.matchingDeal.discountPercent}% OFF)`}
                </span>
              </div>
            </div>
            {onViewMatchingDeal ? (
              <button
                type="button"
                className="matching-deal-btn"
                onClick={() => {
                  onClose();
                  onViewMatchingDeal(product.matchingDeal!.id);
                }}
              >
                View Deal <ExternalLink size={14} />
              </button>
            ) : (
              <a
                href={product.matchingDeal.productUrl}
                target="_blank"
                rel="noreferrer"
                className="matching-deal-btn"
              >
                Buy <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* 6. Primary Action Buttons */}
        <div className="scan-result-actions">
          <button
            type="button"
            className={`scan-save-btn ${isSaved ? "saved" : ""}`}
            onClick={handleToggleFavorite}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
            <span>{isSaved ? "Saved to Favorites" : "Save Item"}</span>
          </button>

          <button
            type="button"
            className="editorial-primary-btn scan-another-btn"
            onClick={onScanAnother}
          >
            <Camera size={18} />
            <span>Scan Another</span>
          </button>
        </div>

        {isSavedNotice && (
          <div className="text-center text-xs text-lime font-medium py-1">
            ✓ Scan saved to your personal history
          </div>
        )}

        {/* 7. Optional In-Store Purchase Log */}
        <div className="scan-store-log-section">
          <span className="text-xs font-semibold text-muted mb-2 block">
            Optional: Log in-store price & retailer
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Building size={14} className="input-icon-left text-muted" />
              <input
                type="text"
                placeholder="Store (e.g. CVS)"
                value={storeInput}
                onChange={(e) => setStoreInput(e.target.value)}
                onBlur={handleSaveStoreAndPrice}
                className="scan-micro-input with-icon"
              />
            </div>
            <div className="relative">
              <DollarSign size={14} className="input-icon-left text-muted" />
              <input
                type="text"
                placeholder="Price ($)"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={handleSaveStoreAndPrice}
                className="scan-micro-input with-icon"
              />
            </div>
          </div>
        </div>

        {/* 8. Flag Result & Community Evidence Section */}
        <div className="scan-flag-section">
          {!showFlagInput ? (
            <button
              type="button"
              className={`scan-flag-btn ${isFlagged ? "flagged" : ""}`}
              onClick={() => setShowFlagInput(true)}
            >
              <Flag size={14} />
              <span>{isFlagged ? "Result Flagged (Review Pending)" : "Flag Incorrect Result or Provide Evidence"}</span>
            </button>
          ) : (
            <div className="scan-flag-form">
              <span className="scan-flag-title">Report eligibility discrepancy or supporting evidence:</span>
              <textarea
                rows={2}
                placeholder="e.g. FSA Store link, receipt detail, or formulation facts..."
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                className="scan-flag-textarea"
              />
              <div className="scan-flag-actions">
                <button
                  type="button"
                  className="editorial-primary-btn text-xs py-1.5 px-3"
                  onClick={handleSubmitFlag}
                >
                  Submit Evidence
                </button>
                <button
                  type="button"
                  className="scan-flag-cancel-btn"
                  onClick={() => setShowFlagInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {flagNotice && (
            <div className="text-center text-xs text-lime font-medium py-1">
              ✓ Evidence submitted. Result flagged for review.
            </div>
          )}
        </div>

        {/* 9. Technical Details & Evidence (Expandable Accordion) */}
        <div className="scan-evidence-accordion">
          <button
            type="button"
            className="scan-evidence-toggle"
            onClick={() => setShowEvidence((prev) => !prev)}
          >
            <span>Regulatory Evidence & FSAFEDS Details</span>
            {showEvidence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showEvidence && (
            <div className="scan-evidence-content">
              {product.medicalCategory && (
                <div className="evidence-row">
                  <span className="evidence-term">Medical Subcategory:</span>
                  <span className="evidence-val font-semibold text-lavender">{product.medicalCategory}</span>
                </div>
              )}
              {product.activeIngredient && (
                <div className="evidence-row">
                  <span className="evidence-term">Active Ingredient:</span>
                  <span className="evidence-val font-semibold text-white">{product.activeIngredient}</span>
                </div>
              )}
              {product.purpose && (
                <div className="evidence-row">
                  <span className="evidence-term">Medical Purpose:</span>
                  <span className="evidence-val text-white">{product.purpose}</span>
                </div>
              )}
              <div className="evidence-row">
                <span className="evidence-term">Regulatory Authority:</span>
                <span className="evidence-val">{product.evidenceSource}</span>
              </div>
              {product.evidenceUrl && (
                <div className="evidence-row">
                  <span className="evidence-term">Official Source Reference:</span>
                  <a
                    href={product.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="evidence-val text-lavender hover:underline flex items-center gap-1 justify-end"
                  >
                    View Official Reference <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {product.evidenceNote && (
                <div className="evidence-row">
                  <span className="evidence-term">Evidence Note:</span>
                  <span className="evidence-val">{product.evidenceNote}</span>
                </div>
              )}
              <div className="evidence-row">
                <span className="evidence-term">IRS Classification:</span>
                <span className="evidence-val">IRC Section 213(d) Healthcare Expense</span>
              </div>
              <div className="evidence-row">
                <span className="evidence-term">Evidence Verified Date:</span>
                <span className="evidence-val">{product.verifiedAt}</span>
              </div>
              <div className="evidence-row">
                <span className="evidence-term">Scan Timestamp:</span>
                <span className="evidence-val">
                  {new Date(product.scannedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
