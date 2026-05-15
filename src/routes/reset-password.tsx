import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, Loader2, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated — signing you in");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_80)] p-4 sm:p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.69_0.19_45/0.15),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[0_24px_48px_oklch(0.18_0.02_270/0.08)] sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
            <Star className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <div className="text-xl font-bold">Set new password</div>
            <div className="text-xs text-muted-foreground">Choose a strong password</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              required type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="New password" minLength={8}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              required type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password" minLength={8}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }} disabled={loading} type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.65_0.21_35)] py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Update Password <ArrowRight className="h-4 w-4" /></>)}
          </motion.button>
        </form>

        <Link to="/login" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">← Back to sign in</Link>
      </motion.div>
    </div>
  );
}
