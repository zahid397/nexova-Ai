import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Minus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inventory")({ component: Inventory });

function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    supabase.from("inventory").select("*").order("item_name").then(({ data }) => {
      setItems(data ?? []); setLoading(false);
    });
  };
  useEffect(load, []);

  const update = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    setItems(arr => arr.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    const { error } = await supabase.from("inventory").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  };

  const alerts = items.filter(i => i.quantity <= i.reorder_level).length;

  return (
    <>
      <TopBar title="Inventory" />
      <div className="space-y-6 p-8">
        {alerts > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl bg-[oklch(0.96_0.04_27)] px-4 py-3 text-sm text-[oklch(0.5_0.2_27)]">
            <AlertTriangle className="h-4 w-4" />
            <span><strong>{alerts}</strong> items need attention</span>
          </motion.div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-secondary" />
          )) : items.map((item, i) => {
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
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold leading-tight">{item.item_name}</h3>
                      <div className="text-[11px] text-muted-foreground">{item.sku} · {item.category}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>{status}</span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Stock</div>
                    <div className="text-2xl font-bold">{item.quantity}</div>
                    <div className="text-[10px] text-muted-foreground">reorder at {item.reorder_level}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">Price</div>
                    <div className="text-lg font-bold">${Number(item.price).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${barColor}`}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => update(item.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-accent">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => update(item.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => update(item.id, 10)} className="ml-auto rounded-lg bg-secondary px-3 py-1.5 text-[11px] font-semibold hover:bg-accent">
                    +10
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
