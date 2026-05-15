import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Package, AlertTriangle, Search, TrendingUp, Boxes, DollarSign } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

export const Route = createFileRoute("/_app/inventory")({ component: Inventory });

function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "ok" | "out">("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const flashRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = () => {
    setLoading(true);
    supabase.from("inventory").select("*").order("item_name").then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  // GSAP entrance animation
  useEffect(() => {
    if (loading || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".gsap-stat",
        { y: 24, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(1.4)" }
      );
      gsap.fromTo(".gsap-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: "power3.out", delay: 0.15 }
      );
      gsap.fromTo(".gsap-bar > div",
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.9, stagger: 0.04, ease: "power2.out", delay: 0.4 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [loading, items.length]);

  const update = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    if (newQty === item.quantity) return;

    // Optimistic update
    setItems(arr => arr.map(i => i.id === id ? { ...i, quantity: newQty } : i));

    // GSAP flash animation on the number
    const el = flashRefs.current[id];
    if (el) {
      gsap.fromTo(el,
        { scale: 1.4, color: delta > 0 ? "#16a34a" : "#dc2626" },
        { scale: 1, color: "", duration: 0.5, ease: "elastic.out(1, 0.5)", clearProps: "color" }
      );
    }

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchQ = !query || i.item_name.toLowerCase().includes(query.toLowerCase()) || i.sku.toLowerCase().includes(query.toLowerCase());
      const matchF = filter === "all"
        || (filter === "low" && i.quantity > 0 && i.quantity <= i.reorder_level)
        || (filter === "out" && i.quantity === 0)
        || (filter === "ok" && i.quantity > i.reorder_level);
      return matchQ && matchF;
    });
  }, [items, query, filter]);

  const alerts = items.filter(i => i.quantity <= i.reorder_level).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;
  const totalValue = items.reduce((s, i) => s + i.quantity * Number(i.price), 0);

  return (
    <>
      <TopBar title="Inventory" onRefresh={load} />
      <div ref={rootRef} className="space-y-6 p-4 sm:p-8">
        {/* Stats */}
        <div ref={headerRef} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Boxes} label="Total Items" value={items.length} tone="blue" />
          <StatCard icon={TrendingUp} label="Inventory Value" value={`$${totalValue.toFixed(0)}`} tone="green" />
          <StatCard icon={AlertTriangle} label="Low Stock" value={alerts} tone="amber" />
          <StatCard icon={Package} label="Out of Stock" value={outOfStock} tone="red" />
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search items or SKU..."
              className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["all", "ok", "low", "out"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {f === "all" ? "All" : f === "ok" ? "In Stock" : f === "low" ? "Low" : "Out"}
              </button>
            ))}
          </div>
        </div>

        {alerts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-[oklch(0.85_0.1_27)] bg-[oklch(0.97_0.03_27)] px-4 py-3 text-sm text-[oklch(0.45_0.2_27)]"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><strong>{alerts}</strong> {alerts === 1 ? "item needs" : "items need"} restocking</span>
          </motion.div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-secondary" />
          )) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => {
                const ratio = item.quantity / Math.max(item.reorder_level * 2, 1);
                const status = item.quantity === 0 ? "Out of Stock"
                  : item.quantity <= item.reorder_level ? "Low Stock"
                  : "In Stock";
                const statusColor = item.quantity === 0 ? "bg-destructive text-destructive-foreground"
                  : item.quantity <= item.reorder_level ? "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.18_85)]"
                  : "bg-[oklch(0.95_0.06_150)] text-[oklch(0.4_0.15_150)]";
                const barColor = item.quantity === 0 ? "bg-destructive"
                  : item.quantity <= item.reorder_level ? "bg-[oklch(0.78_0.16_80)]"
                  : "bg-[oklch(0.7_0.17_150)]";

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="gsap-card group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold leading-tight">{item.item_name}</h3>
                          <div className="truncate text-[11px] text-muted-foreground">{item.sku} · {item.category}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>{status}</span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] text-muted-foreground">Stock</div>
                        <div
                          ref={el => { flashRefs.current[item.id] = el; }}
                          className="text-3xl font-bold tabular-nums"
                        >
                          {item.quantity}
                        </div>
                        <div className="text-[10px] text-muted-foreground">reorder at {item.reorder_level}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                          <DollarSign className="h-3 w-3" />Price
                        </div>
                        <div className="text-lg font-bold tabular-nums">${Number(item.price).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="gsap-bar mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full ${barColor}`}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        onClick={() => update(item.id, -1)}
                        disabled={item.quantity === 0}
                        aria-label="Decrease stock"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition hover:bg-accent active:bg-accent disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        onClick={() => update(item.id, 1)}
                        aria-label="Increase stock"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 active:opacity-80"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => update(item.id, 10)}
                        className="ml-auto rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold hover:bg-accent"
                      >
                        +10
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => update(item.id, 50)}
                        className="rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background hover:opacity-90"
                      >
                        +50
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No items match your search.
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: "blue" | "green" | "amber" | "red" }) {
  const tones = {
    blue: "from-[oklch(0.95_0.05_240)] to-[oklch(0.92_0.08_240)] text-[oklch(0.4_0.18_240)]",
    green: "from-[oklch(0.95_0.05_150)] to-[oklch(0.92_0.08_150)] text-[oklch(0.4_0.15_150)]",
    amber: "from-[oklch(0.95_0.05_85)] to-[oklch(0.92_0.08_85)] text-[oklch(0.45_0.18_85)]",
    red: "from-[oklch(0.95_0.05_27)] to-[oklch(0.92_0.08_27)] text-[oklch(0.45_0.2_27)]",
  };
  return (
    <div className={`gsap-stat rounded-2xl border border-border bg-gradient-to-br ${tones[tone]} p-3.5 shadow-[var(--shadow-soft)]`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
