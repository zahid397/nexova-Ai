import { Bell, RefreshCw, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function TopBar({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  const { profile, user } = useAuth();
  const initials = (profile?.name || user?.email || "U")
    .split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 sm:px-8 py-4 backdrop-blur-xl">
      <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary">
          <Calendar className="h-3.5 w-3.5" /> Last 30 days
        </button>
        <button onClick={onRefresh} className="rounded-xl bg-card p-2 text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button className="relative rounded-xl bg-card p-2 text-muted-foreground shadow-[var(--shadow-soft)] hover:bg-secondary">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
      </div>
    </div>
  );
}
