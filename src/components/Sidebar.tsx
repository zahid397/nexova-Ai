import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Bot, BarChart2, TrendingUp, Package, Settings, LogOut, Star, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ai-agent", label: "AI Agent", icon: Bot },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const initials = (profile?.name || user?.email || "U")
    .split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_8px_24px_oklch(0.69_0.19_45/0.35)]">
          <Star className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="text-lg font-bold tracking-tight">Nexova AI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((l, i) => {
          const active = loc.pathname.startsWith(l.to);
          const Icon = l.icon;
          return (
            <motion.div
              key={l.to}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={l.to}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_oklch(0.69_0.19_45/0.25)]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {l.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{profile?.name || "User"}</div>
            <div className="text-xs text-muted-foreground">Super Admin</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={() => setDark(d => !d)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent"
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {dark ? "Light" : "Dark"}
          </button>
          <button
            onClick={async () => { await signOut(); nav({ to: "/login" }); }}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
