## Goal

Right now `/dashboard` is dominated by the chat panel and overlaps with `/ai-agent`. Rebuild both pages so they have clearly distinct roles, keep the orange/cream enterprise SaaS look, and make every button functional with real Supabase data.

## 1. `/dashboard` — Enterprise Dashboard (rewrite)

Replace `src/routes/_app/dashboard.tsx`. Remove the large `ChatPanel`; AI gets a small insight card only.

Layout (top → bottom, responsive grid):

- TopBar with title "Dashboard", Refresh button (re-runs all loaders), Date range selector (7d / 30d / 90d / All — filters all queries).
- Welcome header: "Welcome back, {profile.name}" + subtitle with current date range.
- KPI row (4 cards, Framer Motion staggered entry):
  - Total Revenue — sum of `sales_records.amount` in range
  - Total Orders — count in range
  - Profit Margin — derived: `(revenue - estimated_cost) / revenue`, where cost = sum(`inventory.price * quantity_sold`) approximated from category mapping; if not derivable, fall back to a stable computed ratio (e.g. 32–38% from data)
  - Active Customers — distinct `customer` count in range
- Charts row:
  - Revenue Over Time (area chart, daily buckets)
  - Sales by Category (donut/pie from `sales_records.category`)
- Top Products bar chart (group by `product_name`, top 5 by amount)
- Recent Orders table (last 10 `sales_records`: order_id, customer, product, region, amount, status, created_at)
- Low Stock Alerts card (items where `quantity <= reorder_level`, with item, SKU, qty, reorder level)
- AI Insight Card (compact):
  - One-paragraph summary (auto-generated on load)
  - "Generate Insight" button → calls existing `askNexova` server fn with a fixed prompt like "Give a 2-sentence executive summary of current revenue, orders, and inventory status."
  - Shows provider badge (Gemini / Fallback)
- GSAP entry on header + Framer Motion on cards (already a pattern in repo).

All data via `supabase` browser client (RLS already permits authenticated reads). Refresh button re-runs the loader; date range selector is local state that triggers reload.

## 2. `/ai-agent` — Full AI Workspace (rewrite)

Replace `src/routes/_app/ai-agent.tsx`. Drop the duplicated activity/provider mini-charts (they belong on a metrics page, not the agent command center). Keep CSV/PDF activity export.

Layout:

- TopBar "AI Agent" + Refresh.
- Hero strip: "Nexova AI Command Center" + provider status pills (Gemini active / Rule-based fallback) driven by `provider` state from `ChatPanel`.
- Main two-column grid (stacks on mobile):
  - Left (col-span-2): Full-height `ChatPanel` (already supports streaming-style typing effect and provider callback). Add a Voice Input button in the panel header that uses Web Speech API (`window.SpeechRecognition || webkitSpeechRecognition`); on result, fills the input and sends. Graceful fallback toast if unsupported.
  - Right sidebar:
    - Quick Questions (existing) — clicks call `triggerChatSend`
    - AI Capabilities list (existing)
    - Document & Report actions card with 4 buttons, all wired:
      - **Generate PDF Report** — pulls latest sales/inventory/contracts + last AI response, renders a styled multi-section PDF via `jsPDF` + `jspdf-autotable` (already installed) and downloads.
      - **Export Chat** — downloads `chat_history` as JSON (and offers .txt via a small toggle or second click — keep simple: JSON).
      - **Share Report** — uses `navigator.share` if available with the generated summary text; otherwise copies to clipboard + toast.
      - **Copy Summary** — copies the latest AI response (or generated summary) to clipboard + toast.
    - Chat History card: last 10 `chat_history` rows for current user with timestamp + message preview; clicking re-sends question.

`ChatPanel` already streams token-by-token. Verify the typing effect and provider switching still work; add voice input button inside `ChatPanel` header (small mic icon) — needs a small `ChatPanel` edit.

## 3. `/reports` and `/inventory`

No changes. Both already match the spec (sales table, contracts tab + AI analyze, CSV export; inventory cards + low-stock + qty updates). Verify nothing imports the old dashboard pieces.

## Technical notes

- New helper `src/lib/dashboard-insight.ts` (client-side): builds the prompt and calls `askNexova` server fn via `useServerFn`. Reuses existing `src/lib/ai.functions.ts` — no new server fn needed.
- PDF generation lives client-side in `/ai-agent` using already-installed `jspdf` + `jspdf-autotable`. New helper `buildBusinessReport(sales, inventory, contracts, aiSummary)` returns a `jsPDF` doc.
- Date range on dashboard is a simple `<Select>` from existing shadcn ui; queries use `.gte("created_at", sinceIso)`.
- Voice input: feature-detect; if missing, the button shows a "not supported in this browser" toast and stays visible but disabled.
- All Framer Motion entries use the existing `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}` pattern; GSAP only for the dashboard title (existing pattern).
- Colors: continue using semantic tokens already defined (`primary`, `card`, `secondary`, `--shadow-soft`, `--shadow-glow`). No new tokens needed.

## Files touched

- rewrite: `src/routes/_app/dashboard.tsx`
- rewrite: `src/routes/_app/ai-agent.tsx`
- edit: `src/components/ChatPanel.tsx` (add voice input mic button + handler)
- new: `src/lib/report-pdf.ts` (PDF builder)
- new: `src/lib/dashboard-insight.ts` (insight prompt helper)

No DB migrations, no new server functions, no new dependencies.
