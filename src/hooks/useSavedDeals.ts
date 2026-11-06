import { useState, useEffect, useCallback } from "react";
import { ProductObservation } from "../types/product";

const STORAGE_KEY = "fsa_saved_deal_ids";

export function useSavedDeals() {
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // Storage write error fallback
    }
  }, [savedIds]);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggleSave = useCallback((target: string | ProductObservation) => {
    const id = typeof target === "string" ? target : target.id;
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearSaved = useCallback(() => {
    setSavedIds([]);
  }, []);

  return { savedIds, isSaved, toggleSave, clearSaved };
}
