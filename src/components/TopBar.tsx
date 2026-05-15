import { Bell, RefreshCw, Calendar, Package, FileText, TrendingUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Notif = { id: string; icon: any; title: string; desc: string; time: string };

export function TopBar({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const initials = (profile?.name || user?.email || "U")
    .split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();

  const loadNotifs = async () => {
    const [invRes, contractsRes, salesRes] = await Promise.all([
      supabase.from("inventory").select("id,item_name,quantity,reorder_level"),
      supabase.from("contracts").select("id,title,vendor,status,end_date"),
      supabase.from("sales_records").select("id,amount,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const list: Notif[] = [];
    (invRes.data ?? []).filter((i: any) => i.quantity <= i.reorder_level).slice(0, 4).forEach((i: any) => {
      list.push({ id: `inv-${i.id}`, icon: Package, title: `Low stock: ${i.item_name}`, desc: `Only ${i.quantity} units left — reorder soon`, time: "now" });
    });
    (contractsRes.data ?? []).filter((c: any) => {
      if (!c.end_date) return false;
      const days = (new Date(c.end_date).getTime() - Date.now()) / 86400000;
      return days > 0 && days < 60;
    }).slice(0, 3).forEach((c: any) => {
      list.push({ id: `c-${c.id}`, icon: FileText, title: `Contract expiring: ${c.title}`, desc: `${c.vendor} — ends ${c.end_date}`, time: "soon" });
    });
    const recent = salesRes.data?.[0];
    if (recent) {
      list.push({
        id: `s-${recent.id}`,
        icon: TrendingUp,
        title: `New sale recorded: $${Number(recent.amount).toLocaleString()}`,
        desc: new Date(recent.created_at).toLocaleString(),
        time: "recent",
      });
    }
    setNotifs(list);
  };

  useEffect(() => { loadNotifs(); }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (open && popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      await loadNotifs();
      toast.success("Data refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 sm:px-8 py-4 backdrop-blur-xl">
      <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary">
          <Calendar className="h-3.5 w-3.5" /> Last 30 days
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          className="rounded-xl bg-card p-2 text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>

        <div className="relative" ref={popRef}>
          <button
            onClick={() => { setOpen(o => !o); loadNotifs(); }}
            aria-label="Notifications"
            className="relative rounded-xl bg-card p-2 text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary"
          >
            <Bell className="h-4 w-4" />
            {notifs.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {notifs.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] z-50"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="text-sm font-bold">Notifications</div>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">All caught up — no alerts.</div>
                  ) : notifs.map(n => (
                    <div key={n.id} className="flex gap-3 border-b border-border/50 px-4 py-3 last:border-0 hover:bg-secondary/50">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <n.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{n.title}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{n.desc}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setNotifs([]); toast.success("Notifications cleared"); }}
                  className="w-full rounded-b-2xl border-t border-border px-4 py-2.5 text-xs font-semibold text-primary hover:bg-secondary"
                >
                  Mark all as read
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
      </div>
    </div>
  );
}
