import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ChatPanel, triggerChatSend } from "@/components/ChatPanel";
import { motion } from "framer-motion";
import {
  Sparkles, FileText, TrendingUp, Package, Users, Bot,
  Download, FileDown, Share2, Copy, History, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { buildBusinessReport } from "@/lib/report-pdf";

export const Route = createFileRoute("/_app/ai-agent")({ component: AIAgent });

const QUICK = [
  "What caused the revenue spike this week?",
  "Which contracts are expiring soon?",
  "Which items need urgent restocking?",
  "What is our profit margin trend?",
  "Forecast revenue for next 30 days",
  "Summarize active contracts",
];

const CAPS = [
  { icon: TrendingUp, label: "Sales Analysis", desc: "Trend and revenue insights" },
  { icon: FileText, label: "Contract Review", desc: "Risk and obligation extraction" },
  { icon: Sparkles, label: "Forecasting", desc: "30-day predictions" },
  { icon: Package, label: "Inventory Alerts", desc: "Restock recommendations" },
  { icon: Users, label: "HR & Customers", desc: "Team & customer insights" },
];

function AIAgent() {
  const [provider, setProvider] = useState("gemini");
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [lastResponse, setLastResponse] = useState("");

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_history")
      .select("created_at,message,response")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data ?? []);
    if (data?.[0]) setLastResponse(data[0].response);
  };

  useEffect(() => { loadHistory(); }, [user]);

  const handleProvider = (p: string) => {
    setProvider(p);
    setTimeout(loadHistory, 600);
  };

  const fetchReportData = async () => {
    const [s, i, c] = await Promise.all([
      supabase.from("sales_records").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("inventory").select("*"),
      supabase.from("contracts").select("*"),
    ]);
    return { sales: s.data ?? [], inventory: i.data ?? [], contracts: c.data ?? [] };
  };

  const summaryText = async () => {
    const d = await fetchReportData();
    const rev = d.sales.reduce((s, r: any) => s + Number(r.amount), 0);
    const low = d.inventory.filter((x: any) => x.quantity <= x.reorder_level).length;
    const cust = new Set(d.sales.map((s: any) => s.customer).filter(Boolean)).size;
    return lastResponse?.trim() ||
      `Nexova business summary: revenue $${rev.toLocaleString()} across ${d.sales.length} orders from ${cust} customers. ${low} items below reorder level. ${d.contracts.length} contracts on file.`;
  };

  const generatePDF = async () => {
    try {
      const d = await fetchReportData();
      const summary = await summaryText();
      const doc = buildBusinessReport({ ...d, aiSummary: summary, user: profile?.name ?? user?.email });
      doc.save(`nexova-report-${Date.now()}.pdf`);
      toast.success("PDF report generated");
    } catch (e: any) {
      toast.error("PDF generation failed");
    }
  };

  const exportChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_history")
      .select("created_at,message,response")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!data?.length) { toast.error("No chat history yet"); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nexova-chat-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} messages`);
  };

  const shareReport = async () => {
    const text = await summaryText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Nexova AI Report", text });
        toast.success("Shared");
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share text copied to clipboard");
    }
  };

  const copySummary = async () => {
    const text = await summaryText();
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied");
  };

  return (
    <>
      <TopBar title="AI Agent" onRefresh={loadHistory} />
      <div className="grid grid-cols-1 gap-4 p-3 sm:gap-6 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-5 lg:col-span-2">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-5"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-primary">
                  <Sparkles className="h-5 w-5" fill="currentColor" />
                </div>
                <div>
                  <div className="text-base font-bold sm:text-lg">Nexova AI Command Center</div>
                  <div className="text-[11px] text-muted-foreground sm:text-xs">RAG · Live Supabase data · Streaming responses</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ProviderPill active={provider === "gemini"} color="green" label="Gemini" />
                <ProviderPill active={provider === "fallback"} color="blue" label="Fallback" />
              </div>
            </div>
          </motion.div>

          {/* Chat */}
          <div className="h-[640px]">
            <ChatPanel onProviderChange={handleProvider} />
          </div>
        </div>

        <div className="space-y-5">
          {/* Report actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Reports & Sharing</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn icon={Download} label="Generate PDF" onClick={generatePDF} primary />
              <ActionBtn icon={FileDown} label="Export Chat" onClick={exportChat} />
              <ActionBtn icon={Share2} label="Share Report" onClick={shareReport} />
              <ActionBtn icon={Copy} label="Copy Summary" onClick={copySummary} />
            </div>
          </motion.div>

          {/* Quick Questions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Quick Questions</h3>
            </div>
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

          {/* Capabilities */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
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

          {/* History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Recent History</h3>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {history.length === 0 && <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">No chats yet.</div>}
              {history.slice(0, 10).map((h, i) => (
                <button
                  key={i}
                  onClick={() => triggerChatSend(h.message)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-left transition hover:border-primary hover:bg-secondary"
                >
                  <div className="truncate text-xs font-semibold">{h.message}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function ProviderPill({ active, color, label }: { active: boolean; color: "green" | "blue"; label: string }) {
  const dot = active
    ? (color === "green" ? "bg-[oklch(0.7_0.17_150)]" : "bg-[oklch(0.7_0.17_240)]")
    : "bg-muted";
  return (
    <div className={`flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold ${active ? "" : "opacity-60"}`}>
      <span className={`h-2 w-2 rounded-full ${dot} ${active ? "animate-pulse" : ""}`} />
      {label}{active && " active"}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, primary }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
        primary
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
          : "border border-border bg-background hover:border-primary hover:bg-secondary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </motion.button>
  );
}
