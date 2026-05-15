import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ChatPanel } from "@/components/ChatPanel";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, loading: true });
  const [chart, setChart] = useState<{ date: string; revenue: number }[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".gsap-kpi", { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" });
      gsap.from(".gsap-title", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" });
      gsap.from(".gsap-chat", { x: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: "power3.out" });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const load = async () => {
    setStats(s => ({ ...s, loading: true }));
    const { data } = await supabase.from("sales_records").select("amount,created_at").order("created_at", { ascending: false }).limit(1000);
    const sales = data ?? [];
    const revenue = sales.reduce((s, r: any) => s + Number(r.amount), 0);
    const daily: Record<string, number> = {};
    sales.forEach((s: any) => {
      const d = new Date(s.created_at).toISOString().slice(0, 10);
      daily[d] = (daily[d] ?? 0) + Number(s.amount);
    });
    const ch = Object.entries(daily).slice(0, 14).reverse().map(([date, revenue]) => ({ date: date.slice(5), revenue }));
    setChart(ch);
    setStats({ revenue, orders: sales.length, loading: false });
  };

  useEffect(() => { load(); }, []);

  return (
    <div ref={rootRef}>
      <TopBar title="Dashboard" onRefresh={load} />
      <div className="space-y-6 p-8">
        <div className="gsap-title">
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, Zahid Hasan!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here is your Nexova AI operational overview.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2 [&>*]:gsap-kpi">
            <KpiCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Total Revenue"
              value={`$${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change="+2.3%"
              positive delay={0.1} loading={stats.loading}
            />
            <KpiCard
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Total Orders"
              value={stats.orders.toLocaleString()}
              change="-10.5%"
              positive={false} delay={0.2} loading={stats.loading}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Revenue Trend</div>
                  <div className="text-sm font-bold">Last 14 days</div>
                </div>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.005 80)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px oklch(0.18 0.02 270 / 0.1)" }} />
                    <Line type="monotone" dataKey="revenue" stroke="oklch(0.69 0.19 45)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-3"
          >
            <ChatPanel compact />
          </motion.div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ icon, label, value, change, positive, delay, loading }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          {icon}
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          positive ? "bg-[oklch(0.95_0.06_150)] text-[oklch(0.4_0.15_150)]" : "bg-[oklch(0.96_0.04_27)] text-[oklch(0.5_0.2_27)]"
        }`}>
          {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {change}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">
          {loading ? <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-secondary" /> : value}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">vs last month</div>
      </div>
    </motion.div>
  );
}
