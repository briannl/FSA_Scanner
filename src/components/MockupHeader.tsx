import React, { useState } from "react";
import { TrackerStatus } from "../types/product";
import { SettingsSheet } from "./SettingsSheet";
import { ScanBarcode, SlidersHorizontal } from "lucide-react";

interface MockupHeaderProps {
  status: TrackerStatus;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  subtitle?: string;
}

export const MockupHeader: React.FC<MockupHeaderProps> = ({
  status,
  isRefreshing,
  onRefreshAll,
  isDarkMode,
  onToggleTheme,
  onExportCsv,
  onOpenImportModal,
  subtitle = "Your shopping companion"
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="mockup-header">
        <div className="mockup-header-inner">
          {/* Left: App Logo & Title matching mockup */}
          <div className="mockup-header-brand">
            <div className="mockup-header-logo-box" aria-label="FSA Tracker Icon">
              <ScanBarcode size={21} className="mockup-header-icon" strokeWidth={2.4} />
            </div>
            <div className="mockup-header-titles">
              <h1 className="mockup-app-title">FSA Scanner</h1>
              <p className="mockup-app-subtitle">{subtitle}</p>
            </div>
          </div>

          {/* Right: Circular Settings Button */}
          <button
            type="button"
            className="mockup-settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings and preferences"
            title="Settings & Preferences"
          >
            <SlidersHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* Settings Bottom Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={status}
        isRefreshing={isRefreshing}
        onRefreshAll={onRefreshAll}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        onExportCsv={onExportCsv}
        onOpenImportModal={onOpenImportModal}
      />
    </>
  );
};
