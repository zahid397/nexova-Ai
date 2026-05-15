import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { User, Mail, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

function Settings() {
  const { user, profile } = useAuth();
  return (
    <>
      <TopBar title="Settings" />
      <div className="max-w-2xl space-y-5 p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-sm font-bold">Profile</h2>
          <div className="space-y-3">
            <Row icon={<User className="h-4 w-4" />} label="Name" value={profile?.name || "—"} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email || "—"} />
            <Row icon={<Shield className="h-4 w-4" />} label="Role" value={profile?.role || "—"} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" /> AI Configuration</h2>
          <p className="text-xs text-muted-foreground">Nexova AI uses Gemini 2.5 Flash through the Lovable AI Gateway. No API key required.</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3 text-xs">
              <span>Primary Model</span>
              <strong>google/gemini-2.5-flash</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3 text-xs">
              <span>Fallback</span>
              <strong>Rule-based engine</strong>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
