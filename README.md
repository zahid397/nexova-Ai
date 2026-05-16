
# 🎙️ Nexova AI

<div align="center">
  <img src="./public/logo.svg" alt="Nexova AI Logo" width="120" />
  <h3>Enterprise Intelligence & Autonomous Operations Platform</h3>
  <p>
    <b>Built for the <i>Transforming Enterprise Through AI</i> Hackathon</b><br/>
    <sub>AI Agent Olympics 2026 · Milan AI Week</sub>
  </p>
</div>

---

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## 🚀 Overview

**Nexova AI** turns scattered operational data into a **conversational command centre** for the modern enterprise.  
A single dashboard gives you live KPIs, inventory alerts, contract intelligence, and a **Gemini‑powered AI Agent** that can answer business questions, generate forecasts, and analyse documents – all without leaving your browser.

---

## 🧠 Core Features

| Module | Description |
|--------|-------------|
| 📊 **Enterprise Dashboard** | Real‑time revenue charts, KPI cards, top products, recent orders, and anomaly detection. |
| 🤖 **AI Agent Workspace** | Chat with an AI that understands your business – streaming replies, voice support, export tools. |
| 📈 **Forecasting Engine** | 30‑day AI revenue predictions with fallback statistical models and interactive visualisations. |
| 📦 **Inventory Intelligence** | Live stock levels, low‑stock alerts, one‑click quantity updates, and colour‑coded health system. |
| 📄 **Reports & Contracts** | Sales reports, contract list, AI‑generated contract summaries, CSV/PDF export. |
| 🔐 **Authentication** | Supabase Auth with Row Level Security. Demo account available for instant exploration. |

---

## 🎯 AI Agent (Gemini 1.5 Flash)

The AI Agent can:

- 📈 **Analyse revenue trends** – *“What caused the revenue spike this week?”*
- 🚨 **Detect inventory risks** – *“Which items need urgent restocking?”*
- 📄 **Summarise contracts** – *“Give me a summary of our active contracts.”*
- 🧠 **Generate forecasts** – *“Predict next month’s revenue.”*
- 💬 **Answer open questions** – *“How did our marketing campaign affect sales?”*

### ⚡ AI Provider Architecture

```

User Query
↓
Gemini 1.5 Flash ─── (if unavailable) ───→ Rule‑Based Intelligence Engine
↓                                              ↓
└─────────────→ Supabase Business Data ←───────┘
↓
Stable Enterprise Response

```

If Gemini fails, the platform falls back to a deterministic engine powered by your own operational data – **your dashboard never breaks**.

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| **Frontend**   | React 19 · TypeScript · Vite                     |
| **Styling**    | Tailwind CSS                                     |
| **Backend**    | Supabase (PostgreSQL + Auth + RLS)               |
| **AI**         | Google Gemini 1.5 Flash                           |
| **Charts**     | Recharts                                         |
| **Animations** | Framer Motion · GSAP                             |
| **Icons**      | Lucide React                                     |
| **Deployment** | Vercel                                           |

---

## 🗄 Database Schema (Supabase)

All tables are protected by **Row Level Security** (RLS) and sync in real‑time.

| Table           | Purpose                       |
|-----------------|-------------------------------|
| `profiles`      | User account & preferences    |
| `sales_records` | All transactions & revenue    |
| `inventory`     | Stock levels & SKU management |
| `contracts`     | Legal & vendor documents      |
| `chat_history`  | AI conversation logs          |

---

## 📊 Application Pages

| Route           | Description                           |
|-----------------|---------------------------------------|
| `/`             | Landing page / redirect               |
| `/dashboard`    | Main analytics dashboard              |
| `/ai-agent`     | Full‑screen AI assistant workspace    |
| `/reports`      | Sales reports & contract analysis    |
| `/forecast`     | AI forecasting engine                 |
| `/inventory`    | Inventory intelligence system         |
| `/settings`     | User & platform settings              |

---

## 🔐 Demo Access

**Try Nexova AI instantly:**

```

Email:    demo@nexova.ai
Password: password123

```

---

## ⚙ Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/zahid397/nexova-ai.git
cd nexova-ai

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.
Use the demo credentials to log in and explore the platform.

---

🧩 Design System

Element Value
Primary #f97316
Background #faf9f7
Cards #ffffff
Accent Tailwind zinc / slate palettes

Clean, premium enterprise aesthetic with smooth micro‑interactions and responsive layout.

---

🛡 Reliability by Design

· Never‑crash architecture – error boundaries at every level
· AI fallback engine – Gemini → rule‑based → graceful degradation
· Skeleton loaders – instant perceived performance
· Graceful API failure handling – data stays accessible even if external services are down

---

🌍 Hackathon Tracks

This project competes in:

Track Relevance
🤖 AI Agents with Google AI Studio Gemini‑powered enterprise workflows, AI automation, operational intelligence
📊 Data & Intelligence Analytics agents, forecasting, business insights from proprietary data

---

👨‍💻 Lead Developer

Zahid Hasan
GitHub: @zahid397

---

📄 License

This project is licensed under the MIT License – see the LICENSE file for details.
© 2026 Zahid Hasan.

---

<div align="center">
  <sub>Built with ❤️ for the AI Agent Olympics</sub>
</div>
```
