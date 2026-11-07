import React, { useState, useRef, useEffect } from "react";
import { X, HelpCircle, Camera, Check } from "lucide-react";
import { FSAFEDS_CATEGORIES, FsafedsCategory } from "../types/fsafeds";
import { EvaluationInput } from "../services/FSAEligibilityEngine";
import { CURATED_BARCODE_DATABASE } from "../data/barcodeCatalog";
import { getBarcodeVariants } from "../utils/barcodeUtils";

interface ManualProductIdentificationModalProps {
  isOpen: boolean;
  barcode: string;
  onClose: () => void;
  onSubmit: (data: EvaluationInput & { labelPhoto?: string | null }) => void;
}

export const ManualProductIdentificationModal: React.FC<ManualProductIdentificationModalProps> = ({
  isOpen,
  barcode,
  onClose,
  onSubmit
}) => {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<FsafedsCategory>("Pain Relief");
  const [ingredientsText, setIngredientsText] = useState("");
  const [storeName, setStoreName] = useState("");
  const [price, setPrice] = useState("");
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prepopulate if barcode matches a known catalog entry
  useEffect(() => {
    if (!barcode) return;
    const variants = getBarcodeVariants(barcode);
    for (const v of variants) {
      if (CURATED_BARCODE_DATABASE[v]) {
        const entry = CURATED_BARCODE_DATABASE[v];
        setProductName(entry.name);
        setBrand(entry.brand);
        setCategory(entry.category);
        if (entry.activeIngredient) {
          setIngredientsText(entry.activeIngredient);
        }
        break;
      }
    }
  }, [barcode]);

  if (!isOpen) return null;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLabelPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError("Please provide a product name.");
      return;
    }

    const parsedPrice = price.trim() ? parseFloat(price.replace(/[^0-9.]/g, "")) : null;

    onSubmit({
      barcode,
      name: productName.trim(),
      brand: brand.trim() || undefined,
      category,
      ingredientsText: ingredientsText.trim() || undefined,
      storeName: storeName.trim() || undefined,
      price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null,
      labelPhoto
    });
  };

  return (
    <div className="scanner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Product Not Found - Manual Identification">
      <div className="scanner-entry-card max-w-lg">
        <div className="scanner-entry-header">
          <div className="flex items-center gap-2">
            <HelpCircle size={22} className="text-warning" />
            <div>
              <h3 className="text-white font-semibold text-lg">Product Not Found</h3>
              <p className="text-xs text-muted">Barcode: {barcode}</p>
            </div>
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

        <form onSubmit={handleSubmit} className="scanner-entry-body space-y-4">
          <p className="text-sm text-muted">
            This barcode isn't in our central catalog yet. Enter the product name and brand below so we can evaluate its FSA/HSA eligibility under IRS 213(d) rules.
          </p>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Product Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Extra Strength Ibuprofen 200mg"
              className="scanner-text-input"
              autoFocus
            />
          </div>

          {/* Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Advil, CVS Health"
                className="scanner-text-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Store Name (Optional)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. CVS, Costco, Target"
                className="scanner-text-input"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">FSAFEDS Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FsafedsCategory)}
              className="scanner-select-input"
            >
              {FSAFEDS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Active Ingredients */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Active Ingredients or Features (Optional)
            </label>
            <input
              type="text"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="e.g. Ibuprofen 200mg, Broad Spectrum SPF 50"
              className="scanner-text-input"
            />
          </div>

          {/* Price & Label Photo */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Store Price ($)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12.99"
                className="scanner-text-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Product Label Photo</label>
              <button
                type="button"
                className="scanner-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} />
                <span>{labelPhoto ? "Photo Attached ✓" : "Snap Label"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePhotoCapture}
              />
            </div>
          </div>

          {error && <p className="scanner-error-message">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="editorial-secondary-btn flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="editorial-primary-btn flex-1"
            >
              <Check size={16} /> Check Eligibility
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
