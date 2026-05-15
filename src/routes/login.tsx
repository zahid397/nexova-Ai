import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("demo@nexova.ai");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Zahid Hasan");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name);
    setLoading(false);
    if (res.error) {
      if (mode === "signin" && res.error.toLowerCase().includes("invalid")) {
        // Auto-create demo account
        const up = await signUp(email, password, name || "Zahid Hasan");
        if (up.error) { toast.error(up.error); return; }
        const back = await signIn(email, password);
        if (back.error) { toast.error("Account created — please check email if confirmation is required."); return; }
        toast.success("Welcome to Nexova AI");
        nav({ to: "/dashboard" });
        return;
      }
      toast.error(res.error);
    } else {
      toast.success(mode === "signin" ? "Welcome back!" : "Account created!");
      nav({ to: "/dashboard" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_80)] p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.69_0.19_45/0.15),transparent_50%),radial-gradient(circle_at_80%_70%,oklch(0.65_0.21_35/0.12),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_24px_48px_oklch(0.18_0.02_270/0.08)]"
      >
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
            <Star className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <div className="text-xl font-bold">Nexova AI</div>
            <div className="text-xs text-muted-foreground">Enterprise Intelligence</div>
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to access your dashboard" : "Start your enterprise AI journey"}
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === "signup" && (
            <input
              required value={name} onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          )}
          <input
            required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            required type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" minLength={6}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={loading} type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-secondary/60 p-3 text-xs">
          <div className="mb-1 font-semibold">Demo credentials</div>
          <div className="text-muted-foreground">demo@nexova.ai / password123 — auto-creates on first sign-in</div>
        </div>

        <button
          onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground">← Back home</Link>
      </motion.div>
    </div>
  );
}
