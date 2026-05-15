import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM = `You are Nexova AI, an enterprise business intelligence assistant for an ERP platform built for Zahid Hasan's company. You receive real-time business data as context. Answer accurately and professionally in 2-4 sentences. Reference specific numbers from the data. Never use markdown formatting (no asterisks, no headers, no bullets — plain prose only).`;

function ruleBased(message: string, ctx: any): string {
  const m = message.toLowerCase();
  const rev = ctx.totalRevenue?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "$0";
  if (/(revenue|sales|earn)/.test(m))
    return `Your current total revenue is ${rev} across ${ctx.totalOrders} orders. The top-performing region is ${ctx.topRegion ?? "North"} with strong demand in ${ctx.topCategory ?? "Electronics"}.`;
  if (/(stock|inventory|restock)/.test(m)) {
    const low = (ctx.lowStock ?? []).map((i: any) => `${i.item_name} (${i.quantity} units)`).join(", ");
    return low ? `${ctx.lowStockCount} items need attention: ${low}. I recommend triggering reorders before week-end to avoid stockouts.` : "All inventory items are healthy and above reorder thresholds.";
  }
  if (/(order|customer)/.test(m))
    return `You have ${ctx.totalOrders} total orders averaging ${(ctx.totalRevenue / Math.max(1, ctx.totalOrders)).toFixed(2)} USD per order. Customer concentration is highest in ${ctx.topRegion ?? "North"}.`;
  if (/(forecast|predict|trend)/.test(m))
    return `Based on the last 30 days trend (${ctx.recentDailyAvg?.toFixed(0)} USD daily average), I project a 30-day forward revenue of approximately $${(ctx.recentDailyAvg * 30).toFixed(0)}. Maintain stock on Electronics for sustained demand.`;
  if (/contract/.test(m))
    return `You have ${ctx.contractCount ?? 0} contracts on file. Active vendors: ${ctx.contractVendors ?? "AWS, FedEx, Atlassian"}. Review expiring agreements within 60-day windows.`;
  return `Based on your current data, total revenue is ${rev} across ${ctx.totalOrders} orders, with ${ctx.lowStockCount ?? 0} inventory items below reorder level. Try asking about revenue, inventory, forecast, or contracts.`;
}

export const askNexova = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) =>
    z.object({ message: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Build context from real data
    const [salesRes, invRes, contractsRes] = await Promise.all([
      supabase.from("sales_records").select("amount,region,category,created_at").limit(1000),
      supabase.from("inventory").select("item_name,quantity,reorder_level"),
      supabase.from("contracts").select("title,vendor,status"),
    ]);

    const sales = salesRes.data ?? [];
    const inv = invRes.data ?? [];
    const contracts = contractsRes.data ?? [];

    const totalRevenue = sales.reduce((s, r: any) => s + Number(r.amount), 0);
    const totalOrders = sales.length;
    const lowStock = inv.filter((i: any) => i.quantity <= i.reorder_level);
    const regionCount: Record<string, number> = {};
    sales.forEach((s: any) => { regionCount[s.region] = (regionCount[s.region] ?? 0) + Number(s.amount); });
    const topRegion = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const catCount: Record<string, number> = {};
    sales.forEach((s: any) => { catCount[s.category] = (catCount[s.category] ?? 0) + 1; });
    const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const last30 = sales.filter((s: any) => Date.now() - new Date(s.created_at).getTime() < 30 * 86400000);
    const recentDailyAvg = last30.reduce((s, r: any) => s + Number(r.amount), 0) / 30;

    const ctx = {
      totalRevenue, totalOrders, lowStock, lowStockCount: lowStock.length,
      topRegion, topCategory, recentDailyAvg,
      contractCount: contracts.length,
      contractVendors: contracts.map((c: any) => c.vendor).join(", "),
    };

    const ctxString = `LIVE DATA: revenue=$${totalRevenue.toFixed(2)}, orders=${totalOrders}, low-stock items=${lowStock.length} (${lowStock.map((i: any) => i.item_name).join(", ") || "none"}), top region=${topRegion}, top category=${topCategory}, 30-day daily avg=$${recentDailyAvg.toFixed(0)}, contracts=${contracts.length} (${contracts.map((c: any) => `${c.title}/${c.vendor}/${c.status}`).join("; ")}).`;

    let aiResponse = "";
    let provider: "gemini" | "fallback" = "fallback";

    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (apiKey) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM + "\n\n" + ctxString },
              { role: "user", content: data.message },
            ],
          }),
        });
        if (res.ok) {
          const j: any = await res.json();
          aiResponse = j.choices?.[0]?.message?.content?.trim() ?? "";
          if (aiResponse) provider = "gemini";
        } else if (res.status === 429) {
          aiResponse = "I'm receiving a lot of requests right now — switching to local analysis. " + ruleBased(data.message, ctx);
        } else if (res.status === 402) {
          aiResponse = "AI credits are exhausted — using local analysis. " + ruleBased(data.message, ctx);
        }
      }
    } catch (e) {
      console.error("AI gateway error", e);
    }

    if (!aiResponse) aiResponse = ruleBased(data.message, ctx);

    // Save chat
    await supabase.from("chat_history").insert({
      user_id: userId,
      message: data.message,
      response: aiResponse,
    });

    return { response: aiResponse, provider };
  });

export const analyzeContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contractId: string }) =>
    z.object({ contractId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: c } = await supabase.from("contracts").select("*").eq("id", data.contractId).single();
    if (!c) throw new Error("Contract not found");

    const fallback = {
      parties: `${c.vendor} & Nexova Inc.`,
      obligations: "Standard service delivery, payment terms net-30, mutual confidentiality, dispute resolution via arbitration.",
      risk: c.value > 100000 ? "High" : c.value > 50000 ? "Medium" : "Low",
      summary: `${c.title} with ${c.vendor} valued at $${Number(c.value).toLocaleString()}, currently ${c.status}. Review ${c.value > 100000 ? "carefully — high financial exposure" : "standard terms"}. Term: ${c.start_date} to ${c.end_date}.`,
    };

    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (apiKey && c.content) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a contract analyst. Analyze the contract and return ONLY valid JSON with keys: parties, obligations, risk (Low|Medium|High), summary. No markdown, no explanation, just JSON." },
              { role: "user", content: `Title: ${c.title}\nVendor: ${c.vendor}\nValue: $${c.value}\nStatus: ${c.status}\nContent: ${c.content}` },
            ],
          }),
        });
        if (res.ok) {
          const j: any = await res.json();
          const text = j.choices?.[0]?.message?.content?.trim() ?? "";
          const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            return { ...fallback, ...parsed, provider: "gemini" as const };
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { ...fallback, provider: "fallback" as const };
  });

export const generateForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const { data: sales } = await supabase
      .from("sales_records")
      .select("amount,created_at")
      .gte("created_at", since);

    const daily: Record<string, number> = {};
    (sales ?? []).forEach((s: any) => {
      const d = new Date(s.created_at).toISOString().slice(0, 10);
      daily[d] = (daily[d] ?? 0) + Number(s.amount);
    });
    const sortedDays = Object.keys(daily).sort();
    const values = sortedDays.map(d => daily[d]);
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);

    // Statistical forecast (with slight trend) — always works
    const trend = values.length > 7 ? (values.slice(-7).reduce((a, b) => a + b, 0) / 7 - avg) * 0.1 : 0;
    const forecast: { date: string; predicted_revenue: number }[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      const noise = (Math.sin(i * 0.7) * 0.15 + Math.random() * 0.1) * avg;
      forecast.push({ date: d, predicted_revenue: Math.max(0, avg + trend * i + noise) });
    }

    const historical = sortedDays.map(d => ({ date: d, revenue: daily[d] }));
    return { historical, forecast, usedFallback: true };
  });
