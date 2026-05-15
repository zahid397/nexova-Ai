import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ChatPanel, triggerChatSend } from "@/components/ChatPanel";
import { motion } from "framer-motion";
import { Sparkles, FileText, TrendingUp, Package, Users, Bot, Activity, MessageSquare, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/_app/ai-agent")({ component: AIAgent });

const QUICK = [
  "What caused the revenue spike this week?",
  "Which contracts are expiring soon?",
  "Which items need urgent restocking?",
  "What is our profit margin trend?",
];

const CAPS = [
  { icon: TrendingUp, label: "Sales Analysis", desc: "Trend and revenue insights" },
  { icon: FileText, label: "Contract Review", desc: "Risk and obligation extraction" },
  { icon: Sparkles, label: "Forecasting", desc: "30-day predictions" },
  { icon: Package, label: "Inventory Alerts", desc: "Restock recommendations" },
  { icon: Users, label: "HR Data", desc: "Team performance" },
];

function AIAgent() {
  const [provider, setProvider] = useState("gemini");
  const { user } = useAuth();
  const [usage, setUsage] = useState<{ date: string; count: number }[]>([]);
  const [providerStats, setProviderStats] = useState<{ name: string; value: number }[]>([]);
  const [totalChats, setTotalChats] = useState(0);

  const loadStats = async () => {
    if (!user) return;
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data } = await supabase
      .from("chat_history")
      .select("created_at,response")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    const rows = data ?? [];
    setTotalChats(rows.length);
    const daily: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      daily[d] = 0;
    }
    rows.forEach((r: any) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (d in daily) daily[d]++;
    });
    setUsage(Object.entries(daily).map(([date, count]) => ({ date: date.slice(5), count })));
    let gemini = 0, fallback = 0;
    rows.forEach((r: any) => { if ((r.response ?? "").length >= 120) gemini++; else fallback++; });
    setProviderStats([
      { name: "Gemini", value: gemini },
      { name: "Fallback", value: fallback },
    ]);
  };

  useEffect(() => { loadStats(); }, [user]);

  return (
    <>
      <TopBar title="AI Agent" onRefresh={loadStats} />
      <div className="grid grid-cols-1 gap-4 p-3 sm:gap-6 sm:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-primary">
                  <Sparkles className="h-5 w-5" fill="currentColor" />
                </div>
                <div>
                  <div className="text-base font-bold sm:text-lg">Nexova AI Agent</div>
                  <div className="text-[11px] text-muted-foreground sm:text-xs">Real-time RAG · Gemini 2.5 Flash · Live data</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }} onClick={exportCSV}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:border-primary hover:bg-secondary"
                >
                  <FileDown className="h-3.5 w-3.5" /> CSV
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }} onClick={exportPDF}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatPill icon={MessageSquare} label="Chats" value={totalChats.toString()} sub="14d" />
            <StatPill icon={Activity} label="Avg/day" value={(totalChats / 14).toFixed(1)} sub="usage" />
            <StatPill icon={Sparkles} label="Model" value="Gemini" sub="2.5 Flash" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">AI Activity</div>
                <div className="text-sm font-bold">Conversations · Last 14 days</div>
              </div>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usage}>
                  <defs>
                    <linearGradient id="aiUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.69 0.19 45)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.69 0.19 45)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.005 80)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px oklch(0.18 0.02 270 / 0.1)" }} />
                  <Area type="monotone" dataKey="count" stroke="oklch(0.69 0.19 45)" strokeWidth={2.5} fill="url(#aiUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Provider mix</div>
                <div className="text-sm font-bold">Gemini vs Fallback</div>
              </div>
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.005 80)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
                  <Bar dataKey="value" fill="oklch(0.69 0.19 45)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="h-[600px]">
            <ChatPanel onProviderChange={setProvider} />
          </div>
        </div>
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">AI Capabilities</h3>
            </div>
            <div className="space-y-2.5">
              {CAPS.map(c => (
                <div key={c.label} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-2.5">
                  <c.icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[11px] text-muted-foreground">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-bold">Quick Questions</h3>
            <div className="space-y-2">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => triggerChatSend(q)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-left text-xs leading-relaxed transition hover:border-primary hover:bg-secondary"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-bold">AI Provider Chain</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${provider === "gemini" ? "bg-[oklch(0.7_0.17_150)]" : "bg-muted"}`} />
                <span>Primary: <strong>Gemini 2.5 Flash</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${provider === "fallback" ? "bg-[oklch(0.7_0.17_240)]" : "bg-muted"}`} />
                <span>Fallback: Rule-based</span>
              </div>
              <div className="mt-2 rounded-lg bg-secondary p-2 text-[11px] text-muted-foreground">
                Last response: <strong className="text-foreground">{provider === "gemini" ? "Gemini" : "Rule-based"}</strong>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function StatPill({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-lg font-bold leading-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
