import { SourceType } from "../types/product";

export function formatSourceLabel(sourceType?: SourceType | string | null): string {
  if (!sourceType) return "Snapshot";
  switch (sourceType) {
    case "github-actions":
      return "GitHub Action";
    case "local-playwright":
      return "Local Playwright";
    case "bookmarklet":
      return "Bookmarklet";
    case "netlify-cron":
      return "Netlify Cron";
    case "manual-import":
      return "Manual Import";
    case "watchlist-page":
      return "Watchlist Page";
    case "catalog-api":
      return "Catalog API";
    case "fixture":
      return "Fixture";
    default:
      return sourceType;
  }
}
