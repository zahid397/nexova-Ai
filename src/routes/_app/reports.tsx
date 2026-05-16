import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Download, FileText, Sparkles, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeContract } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({ component: Reports });

function Reports() {
  const [tab, setTab] = useState<"sales" | "contracts">("sales");
  return (
    <>
      <TopBar title="Reports" />
      <div className="p-8">
        <div className="mb-6 inline-flex rounded-xl bg-secondary p-1">
          {(["sales", "contracts"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${tab === t ? "bg-card text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground"}`}
            >
              {t === "sales" ? "Sales" : "Contracts"}
            </button>
          ))}
        </div>
        {tab === "sales" ? <SalesTable /> : <ContractsList />}
      </div>
    </>
  );
}

function SalesTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("sales_records").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
  }, []);
  const esc = (v: any) => {
    let s = v == null ? "" : String(v);
    // Prevent CSV formula injection in Excel/Sheets
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    // Escape quotes and wrap
    return `"${s.replace(/"/g, '""')}"`;
  };
  const exportCsv = () => {
    const header = "order_id,customer,product,amount,status,date\n";
    const body = rows
      .map(r => [r.order_id, r.customer, r.product_name, r.amount, r.status, r.created_at].map(esc).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales.csv"; a.click();
    toast.success("Exported sales.csv");
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing {rows.length} most recent orders</div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
              <th className="pb-2.5">Order ID</th><th className="pb-2.5">Customer</th><th className="pb-2.5">Product</th>
              <th className="pb-2.5">Amount</th><th className="pb-2.5">Status</th><th className="pb-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="py-3"><div className="h-5 w-full animate-pulse rounded bg-secondary" /></td></tr>
            )) : rows.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 font-mono text-xs">{r.order_id}</td>
                <td>{r.customer}</td>
                <td>{r.product_name}</td>
                <td className="font-semibold">${Number(r.amount).toFixed(2)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    completed: "bg-[oklch(0.95_0.06_150)] text-[oklch(0.4_0.15_150)]",
    processing: "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.18_85)]",
    returned: "bg-[oklch(0.96_0.04_27)] text-[oklch(0.5_0.2_27)]",
    active: "bg-[oklch(0.95_0.06_150)] text-[oklch(0.4_0.15_150)]",
    pending: "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.18_85)]",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status] || "bg-secondary"}`}>{status}</span>;
}

function ContractsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const analyze = useServerFn(analyzeContract);
  useEffect(() => {
    supabase.from("contracts").select("*").then(({ data }) => setRows(data ?? []));
  }, []);
  const run = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await analyze({ data: { contractId: id } });
      setAnalysis(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">{c.title}</h3>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="text-xs text-muted-foreground">{c.vendor}</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">Value</div>
                <div className="text-lg font-bold">${Number(c.value).toLocaleString()}</div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                {c.start_date} → {c.end_date}
              </div>
            </div>
            <button
              onClick={() => run(c.id)}
              disabled={loadingId === c.id}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
            >
              {loadingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Analyze with AI
            </button>
          </motion.div>
        ))}
      </div>

      {analysis && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur" onClick={() => setAnalysis(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">AI Contract Analysis</h2>
              </div>
              <button onClick={() => setAnalysis(null)} className="rounded-lg p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Field label="Parties" value={analysis.parties} />
              <Field label="Obligations" value={analysis.obligations} />
              <div>
                <div className="text-xs text-muted-foreground">Risk Level</div>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                  analysis.risk === "High" ? "bg-[oklch(0.96_0.04_27)] text-[oklch(0.5_0.2_27)]" :
                  analysis.risk === "Medium" ? "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.18_85)]" :
                  "bg-[oklch(0.95_0.06_150)] text-[oklch(0.4_0.15_150)]"
                }`}>{analysis.risk}</span>
              </div>
              <Field label="Summary" value={analysis.summary} />
              <div className="rounded-lg bg-secondary p-2 text-[11px] text-muted-foreground">
                Powered by: <strong className="text-foreground">{analysis.provider === "gemini" ? "Gemini AI" : "Rule-based fallback"}</strong>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 leading-relaxed">{value}</div>
    </div>
  );
}
