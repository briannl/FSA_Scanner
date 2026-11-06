import type { Config } from "@netlify/functions";
import { runCollection } from "./shared/collector";

export default async (_req: Request) => {
  console.log("[CRON] Scheduled FSA Deal Tracker collection started at", new Date().toISOString());
  try {
    const status = await runCollection({ retailer: "all" });
    console.log("[CRON] Scheduled collection completed. Status:", JSON.stringify(status));
    return new Response(JSON.stringify({ success: true, status }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("[CRON] Scheduled collection failed:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  schedule: "0 */12 * * *"
};
