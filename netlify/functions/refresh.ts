import type { Context } from "@netlify/functions";
import {
  runCollection,
  addWatchlistUrl,
  importManualProducts,
  getAllProductsData,
  ingestScrapedProducts
} from "./shared/collector";
import { Retailer } from "../../src/types/product";

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Optional Bearer token authentication
    // If SYNC_SECRET_TOKEN is set in Netlify, verify Authorization header for external pushes
    const syncSecret = process.env.SYNC_SECRET_TOKEN;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

    // Check if this is an external push request (has retailer & products payload, or action: "webhook_ingest")
    const isWebhookPush =
      (body.retailer && Array.isArray(body.products)) ||
      body.action === "webhook_ingest";

    if (syncSecret && isWebhookPush) {
      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
      if (token !== syncSecret) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or missing Bearer token. Please provide Authorization: Bearer <SYNC_SECRET_TOKEN>."
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 1. External Webhook Product Ingestion (from GitHub Actions or local Playwright)
    if (isWebhookPush) {
      const retailer: Retailer = body.retailer === "Costco" ? "Costco" : "CVS";
      const status = await ingestScrapedProducts(retailer, body.products, body.status);
      return new Response(
        JSON.stringify({
          success: true,
          retailer,
          count: body.products ? body.products.length : 0,
          status
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Watchlist Addition
    if (body.action === "add_watchlist" && body.url) {
      const updatedWatchlist = await addWatchlistUrl(body.url);
      return new Response(
        JSON.stringify({ success: true, watchlist: updatedWatchlist }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Manual UI / Bookmarklet Product Import
    if (body.action === "import_products" && Array.isArray(body.products)) {
      await importManualProducts(body.products);
      const allData = await getAllProductsData();
      return new Response(
        JSON.stringify({ success: true, data: allData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Default: Run on-demand collector
    const retailer = body.retailer === "CVS" || body.retailer === "Costco" ? body.retailer : "all";
    const status = await runCollection({ retailer });

    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Refresh failed", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
