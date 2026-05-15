import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Paperclip, Mic, Star } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askNexova } from "@/lib/ai.functions";

interface Msg { role: "user" | "ai"; content: string; provider?: string }

export function ChatPanel({ compact = false, onProviderChange }: { compact?: boolean; onProviderChange?: (p: string) => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Hello Zahid! I'm the Nexova AI Agent. I can help you analyze your retail data. Try asking about revenue, orders, or current inventory." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const ask = useServerFn(askNexova);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: msg }]);
    setThinking(true);
    try {
      const res = await ask({ data: { message: msg } });
      onProviderChange?.(res.provider);
      setThinking(false);
      // Streaming effect
      setMessages(m => [...m, { role: "ai", content: "", provider: res.provider }]);
      const full = res.response;
      let i = 0;
      const interval = setInterval(() => {
        i += 2;
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: full.slice(0, i) };
          return copy;
        });
        if (i >= full.length) clearInterval(interval);
      }, 15);
    } catch (e: any) {
      setThinking(false);
      setMessages(m => [...m, { role: "ai", content: "I hit an error reaching the AI service. Please try again." }]);
    }
  };

  // Expose send for quick questions
  (ChatPanel as any).__lastSend = send;

  return (
    <div className={`flex flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] ${compact ? "h-[600px]" : "h-full"}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <Star className="h-4 w-4 text-primary" fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-bold">Nexova Agent</div>
            <div className="text-xs text-muted-foreground">Powered by Gemini</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[oklch(0.7_0.17_150)]" />
          <span className="text-muted-foreground">Live RAG analysis enabled</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                m.role === "ai" ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
              }`}>
                {m.role === "ai" ? "NX" : "ZH"}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-soft)] ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground"
              }`}>
                {m.content || <span className="opacity-50">…</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">NX</div>
            <div className="rounded-2xl bg-background px-4 py-3 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-1.5">
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0s" }} />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
                <span className="ml-2 text-xs text-muted-foreground">Nexova is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-4 pr-1.5">
          <button type="button" className="text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Nexova AI about revenue, orders, inventory..."
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="button" className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary">
            <Mic className="h-3.5 w-3.5" /> voice
          </button>
          <button type="submit" disabled={!input.trim() || thinking} className="flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40">
            <Send className="h-3.5 w-3.5" /> send
          </button>
        </div>
      </form>
    </div>
  );
}

export function triggerChatSend(text: string) {
  (ChatPanel as any).__lastSend?.(text);
}
