import type { Context } from "@netlify/functions";
import { getAllProductsData } from "./shared/collector";

export default async (req: Request, _context: Context): Promise<Response> => {
  try {
    const data = await getAllProductsData();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Failed to retrieve products data", details: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
