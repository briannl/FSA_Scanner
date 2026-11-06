import React, { useState } from "react";
import { X, Search, Barcode, CheckCircle2, AlertCircle } from "lucide-react";
import { normalizeBarcode, isValidBarcodeString, detectBarcodeFormat } from "../utils/barcodeUtils";

interface ManualBarcodeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBarcode: (barcode: string) => void;
}

export const ManualBarcodeEntryModal: React.FC<ManualBarcodeEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmitBarcode
}) => {
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalized = normalizeBarcode(inputVal);
  const isValid = isValidBarcodeString(normalized);
  const format = normalized ? detectBarcodeFormat(normalized) : null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!normalized) {
      setError("Please enter barcode digits.");
      return;
    }
    if (!isValid) {
      setError("Barcodes should only contain numbers (8 to 14 digits).");
      return;
    }
    setError(null);
    onSubmitBarcode(normalized);
  };

  const handleQuickSample = (sample: string) => {
    setInputVal(sample);
    setError(null);
  };

  return (
    <div className="scanner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Enter Barcode Manually">
      <div className="scanner-entry-card">
        <div className="scanner-entry-header">
          <div className="flex items-center gap-2">
            <Barcode size={22} className="text-lavender" />
            <h3 className="text-white font-semibold text-lg">Enter Barcode</h3>
          </div>
          <button
            type="button"
            className="scanner-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scanner-entry-body">
          <p className="text-muted text-sm mb-3">
            Type or paste the 8, 12, or 13-digit number found beneath the product's barcode lines.
          </p>

          <div className="scanner-input-container">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 050428456123"
              className="scanner-digits-input"
              autoFocus
            />
            {normalized && (
              <span className={`scanner-format-badge ${isValid ? "valid" : "invalid"}`}>
                {isValid ? (
                  <>
                    <CheckCircle2 size={12} /> {format}
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> Needs digits
                  </>
                )}
              </span>
            )}
          </div>

          {error && <p className="scanner-error-message">{error}</p>}

          <button
            type="submit"
            className="editorial-primary-btn w-full mt-4"
            disabled={!isValid}
          >
            <Search size={16} /> Look Up FSA Eligibility
          </button>

          {/* Quick test sample pills */}
          <div className="scanner-samples-section">
            <span className="text-xs text-muted font-medium">Quick Test Barcodes:</span>
            <div className="scanner-samples-grid">
              <button
                type="button"
                className="sample-barcode-chip"
                onClick={() => handleQuickSample("050428456123")}
              >
                BP Monitor (Eligible)
              </button>
              <button
                type="button"
                className="sample-barcode-chip"
                onClick={() => handleQuickSample("305730164402")}
              >
                Advil 200mg (Eligible)
              </button>
              <button
                type="button"
                className="sample-barcode-chip"
                onClick={() => handleQuickSample("070501055304")}
              >
                Sunscreen SPF 70 (Eligible)
              </button>
              <button
                type="button"
                className="sample-barcode-chip"
                onClick={() => handleQuickSample("031604012345")}
              >
                Multivitamin (Needs LMN)
              </button>
              <button
                type="button"
                className="sample-barcode-chip"
                onClick={() => handleQuickSample("028400090858")}
              >
                Doritos (Not Eligible)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
