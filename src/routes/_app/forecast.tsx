import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateForecast } from "@/lib/ai.functions";
import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { ComposedChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_app/forecast")({ component: Forecast });

function Forecast() {
  const fn = useServerFn(generateForecast);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fn();
      setData(res);
    } finally { setLoading(false); }
  };

  const merged = data ? [
    ...data.historical.map((h: any) => ({ date: h.date.slice(5), historical: h.revenue })),
    ...data.forecast.map((f: any) => ({ date: f.date.slice(5), forecast: f.predicted_revenue })),
  ] : [];

  const totalForecast = data?.forecast.reduce((s: number, f: any) => s + f.predicted_revenue, 0) ?? 0;
  const avgDaily = data ? totalForecast / 30 : 0;

  return (
    <>
      <TopBar title="Forecast" />
      <div className="space-y-6 p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">30-Day Revenue Forecast</h2>
            <p className="text-sm text-muted-foreground">AI-powered projection based on the last 60 days of sales</p>
          </div>
          <button
            onClick={run} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Forecast
          </button>
        </motion.div>

        {data && (
          <>
            {data.usedFallback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 rounded-xl bg-[oklch(0.96_0.06_85)] px-4 py-3 text-xs text-[oklch(0.4_0.15_85)]">
                <AlertTriangle className="h-4 w-4" />
                Using statistical projection model — results based on trend analysis of your historical data.
              </motion.div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard icon={<DollarSign className="h-4 w-4" />} label="Avg Daily" value={`$${avgDaily.toFixed(0)}`} />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Forecast" value={`$${totalForecast.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
              <StatCard icon={<Calendar className="h-4 w-4" />} label="Period" value="Next 30 days" />
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h3 className="mb-4 text-sm font-bold">Revenue Forecast</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={merged}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.005 80)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px oklch(0.18 0.02 270 / 0.1)" }} />
                    <Legend />
                    <Bar dataKey="historical" fill="oklch(0.69 0.19 45)" name="Historical" radius={[6, 6, 0, 0]} />
                    <Line type="monotone" dataKey="forecast" stroke="oklch(0.69 0.19 45)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="AI Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </>
        )}

        {!data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-16 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="text-lg font-bold">Ready to forecast</h3>
            <p className="mt-1 text-sm text-muted-foreground">Click "Generate Forecast" to project your next 30 days of revenue.</p>
          </motion.div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </motion.div>
  );
}
