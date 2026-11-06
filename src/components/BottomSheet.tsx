import React, { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onClearAll?: () => void;
  clearLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onClearAll,
  clearLabel = "Reset",
  children,
  footer
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when sheet is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="bottom-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bottom-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="bottom-sheet-handle-bar">
          <div className="bottom-sheet-handle" />
        </div>

        {/* Sheet Header */}
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title-group">
            <h3 className="bottom-sheet-title">{title}</h3>
            {subtitle && <p className="bottom-sheet-subtitle">{subtitle}</p>}
          </div>

          <div className="bottom-sheet-header-actions">
            {onClearAll && (
              <button
                type="button"
                className="bottom-sheet-clear-btn"
                onClick={onClearAll}
              >
                {clearLabel}
              </button>
            )}
            <button
              type="button"
              className="bottom-sheet-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="bottom-sheet-content">
          {children}
        </div>

        {/* Optional Footer CTA */}
        {footer && (
          <div className="bottom-sheet-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
