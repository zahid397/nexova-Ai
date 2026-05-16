import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "signin" | "signup" | "forgot";

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email");
        setMode("signin");
        return;
      }
      const res = mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, name);
      if (res.error) throw new Error(res.error);
      // Wait for session to hydrate before redirect (avoids guard race on Vercel SPA)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Could not establish session. Please try again.");
      toast.success(mode === "signin" ? "Welcome back!" : "Account created — welcome!");
      nav({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.985_0.005_80)] p-4 sm:p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,oklch(0.69_0.19_45/0.18),transparent_55%),radial-gradient(circle_at_85%_75%,oklch(0.65_0.21_35/0.14),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card/95 p-6 shadow-[0_24px_64px_oklch(0.18_0.02_270/0.12)] backdrop-blur sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.65_0.21_35)] shadow-[var(--shadow-glow)]"
          >
            <Star className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </motion.div>
          <div>
            <div className="text-xl font-bold leading-tight">Nexova AI</div>
            <div className="text-[11px] text-muted-foreground">Enterprise Intelligence Platform</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className="mb-1 text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {mode === "signin" && "Sign in with your email to access your dashboard"}
              {mode === "signup" && "Get started in seconds — no credit card required"}
              {mode === "forgot" && "We'll email you a secure link to set a new password"}
            </p>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <Field icon={User}>
                  <input
                    required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Full name" autoComplete="name"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              )}
              <Field icon={Mail}>
                <input
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" autoComplete="email"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>
              {mode !== "forgot" && (
                <Field icon={Lock}>
                  <input
                    required type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              )}

              {mode === "signin" && (
                <button
                  type="button" onClick={() => setMode("forgot")}
                  className="block w-full text-right text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                disabled={loading} type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.65_0.21_35)] py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-secondary/50 p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Bank-grade encryption · GDPR compliant · SOC 2 ready</span>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "signin" && (
                <>Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">Create one</button>
                </>
              )}
              {mode === "signup" && (
                <>Already have an account?{" "}
                  <button onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">Sign in</button>
                </>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">← Back to sign in</button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          <Sparkles className="h-3 w-3" /> Back to home
        </Link>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {children}
    </div>
  );
}
