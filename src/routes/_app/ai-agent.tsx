import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ChatPanel, triggerChatSend } from "@/components/ChatPanel";
import { motion } from "framer-motion";
import { Sparkles, FileText, TrendingUp, Package, Users, Bot } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/ai-agent")({ component: AIAgent });

const QUICK = [
  "What caused the revenue spike this week?",
  "Which contracts are expiring soon?",
  "Which items need urgent restocking?",
  "What is our profit margin trend?",
];

const CAPS = [
  { icon: TrendingUp, label: "Sales Analysis", desc: "Trend and revenue insights" },
  { icon: FileText, label: "Contract Review", desc: "Risk and obligation extraction" },
  { icon: Sparkles, label: "Forecasting", desc: "30-day predictions" },
  { icon: Package, label: "Inventory Alerts", desc: "Restock recommendations" },
  { icon: Users, label: "HR Data", desc: "Team performance" },
];

function AIAgent() {
  const [provider, setProvider] = useState("gemini");
  return (
    <>
      <TopBar title="AI Agent" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[calc(100vh-9rem)]">
          <ChatPanel onProviderChange={setProvider} />
        </div>
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">AI Capabilities</h3>
            </div>
            <div className="space-y-2.5">
              {CAPS.map(c => (
                <div key={c.label} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-2.5">
                  <c.icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[11px] text-muted-foreground">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-bold">Quick Questions</h3>
            <div className="space-y-2">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => triggerChatSend(q)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-left text-xs leading-relaxed transition hover:border-primary hover:bg-secondary"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-bold">AI Provider Chain</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${provider === "gemini" ? "bg-[oklch(0.7_0.17_150)]" : "bg-muted"}`} />
                <span>Primary: <strong>Gemini 2.5 Flash</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${provider === "fallback" ? "bg-[oklch(0.7_0.17_240)]" : "bg-muted"}`} />
                <span>Fallback: Rule-based</span>
              </div>
              <div className="mt-2 rounded-lg bg-secondary p-2 text-[11px] text-muted-foreground">
                Last response: <strong className="text-foreground">{provider === "gemini" ? "Gemini" : "Rule-based"}</strong>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
