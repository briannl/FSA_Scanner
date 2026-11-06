import type { Context } from "@netlify/functions";
import {
  runCollection,
  addWatchlistUrl,
  importManualProducts,
  getAllProductsData
} from "./shared/collector";

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

    if (body.action === "add_watchlist" && body.url) {
      const updatedWatchlist = await addWatchlistUrl(body.url);
      return new Response(
        JSON.stringify({ success: true, watchlist: updatedWatchlist }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.action === "import_products" && Array.isArray(body.products)) {
      await importManualProducts(body.products);
      const allData = await getAllProductsData();
      return new Response(
        JSON.stringify({ success: true, data: allData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default: run collection
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
