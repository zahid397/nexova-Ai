import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Sparkles, BarChart3, Bot, Boxes, TrendingUp, FileText, ShieldCheck,
  ArrowRight, Zap, Brain, Activity, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexova AI — Enterprise Operations Intelligence" },
      { name: "description", content: "AI-powered ERP & business intelligence: real-time dashboards, inventory automation, contract analysis and forecasting. Built for modern enterprises." },
      { property: "og:title", content: "Nexova AI — Enterprise Operations Intelligence" },
      { property: "og:description", content: "AI-powered ERP & business intelligence for modern enterprises." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BarChart3, title: "Real-time Dashboard", desc: "Live KPIs, revenue trends, top products and category breakdowns updated as data flows in." },
  { icon: Bot, title: "AI Agent Command Center", desc: "Conversational analytics powered by Gemini with voice input and PDF report generation." },
  { icon: Boxes, title: "Smart Inventory", desc: "Automatic low-stock alerts, reorder suggestions, and one-click stock updates." },
  { icon: TrendingUp, title: "Predictive Forecasts", desc: "30-day revenue forecasting with trend analysis and seasonality detection." },
  { icon: FileText, title: "Contract Intelligence", desc: "AI-extracted parties, obligations and risk scoring for every vendor agreement." },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "Row-level security, role-based access control and audit-ready data trails." },
];

const STEPS = [
  { num: "01", title: "Connect your data", desc: "Sales, inventory and contracts sync into your secure Nexova workspace." },
  { num: "02", title: "Let the AI think", desc: "Nexova analyzes patterns, flags risks and generates executive summaries." },
  { num: "03", title: "Act with confidence", desc: "Export reports, trigger reorders and brief your team — all from one place." },
];

function Landing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-line", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1 });
      gsap.fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.6, stagger: 0.08 });
      gsap.fromTo(".hero-orb", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out" });
      gsap.fromTo(".feature-card", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.07, scrollTrigger: undefined });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const go = (path: string) => () => nav({ to: user ? "/dashboard" : path });

  return (
    <div ref={heroRef} className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-primary shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexova AI</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#why" className="hover:text-foreground">Why Nexova</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary sm:inline-block">
                  Sign in
                </Link>
                <Link to="/login" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-orb absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="hero-orb absolute -right-20 top-40 h-[320px] w-[320px] rounded-full bg-foreground/10 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="hero-line inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Now with Gemini-powered insights · v1.0
          </div>
          <h1 className="hero-line mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The AI operating system for <span className="text-primary">modern enterprises</span>.
          </h1>
          <p className="hero-line mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Nexova AI unifies your sales, inventory and contracts into a single intelligence layer — then writes the executive summary for you.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={go("/login")}
              className="hero-cta group flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02] hover:opacity-95"
            >
              {user ? "Open Dashboard" : "Start free"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="hero-cta flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground hover:bg-secondary"
            >
              <Activity className="h-4 w-4" /> See it in action
            </a>
          </div>

          {/* Stat strip */}
          <div className="hero-cta mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "12.4%", v: "Revenue lift avg" },
              { k: "<2s", v: "AI response time" },
              { k: "99.9%", v: "Uptime SLA" },
              { k: "256-bit", v: "Encryption" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur">
                <div className="text-2xl font-bold tracking-tight text-primary">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Platform</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything operations needs. Nothing it doesn't.</h2>
            <p className="mt-3 text-muted-foreground">Six purpose-built modules, one unified data plane — designed for finance, ops and leadership teams.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="feature-card group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-base font-bold">{f.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From raw data to executive briefing — in three steps.</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="text-5xl font-bold tracking-tighter text-primary/30">{s.num}</div>
                <div className="mt-4 text-lg font-bold">{s.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-t border-border bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Why Nexova</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for teams that move fast — without breaking the books.</h2>
            <p className="mt-4 text-background/70">
              Most BI tools show you charts. Nexova tells you what to do next. With native Gemini integration and a rule-based fallback, you never wait on the cloud to make a decision.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Live data — no overnight ETL",
                "Role-based access for finance & ops",
                "Works offline with rule-based AI fallback",
                "Export PDF reports in one click",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <button
              onClick={go("/login")}
              className="mt-8 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
            >
              {user ? "Open Dashboard" : "Get started — it's free"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-3xl" />
            <div className="rounded-3xl border border-background/10 bg-background/5 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Brain className="h-4 w-4" /> AI Executive Summary · live
              </div>
              <p className="mt-4 text-base leading-relaxed text-background/90">
                "Q4 revenue is tracking 12.4% above forecast, driven by Electronics in the North region. Three SKUs are below reorder threshold — recommend triggering POs by Friday to maintain margin."
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { l: "Revenue", v: "$46.5K", i: Zap },
                  { l: "Orders", v: "99", i: Activity },
                  { l: "Margin", v: "28.8%", i: TrendingUp },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border border-background/10 bg-background/5 p-3">
                    <m.i className="h-4 w-4 text-primary" />
                    <div className="mt-2 text-lg font-bold">{m.v}</div>
                    <div className="text-[10px] text-background/60">{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" fill="currentColor" />
            © {new Date().getFullYear()} Nexova AI · Built for Zahid Hasan
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
