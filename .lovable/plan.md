# Plan: Landing Page + Insight Fix + Security Hardening

## 1. Public Landing Page at `/`

Currently `/` resolves through `_app` layout (auth-gated) → redirects to `/login`. There is no real landing page, which is why the homepage feels broken and SSR shows the runtime error.

- Create `src/routes/index.tsx` as a **public** route (outside `_app`):
  - Hero: "Nexova AI — Enterprise Operations Intelligence"
  - Animated gradient + GSAP entrance, orange/black/cream theme
  - Feature grid: Real-time Dashboard, AI Agent, Inventory, Forecasts, Contracts, Reports
  - "How it works" 3-step section
  - CTA buttons: **Get Started** → `/login`, **Live Demo** → `/login`
  - Footer with brand + links
  - Proper SEO `head()`: title, description, og tags
- Update `src/routes/_app/index.tsx` so `/dashboard` redirect still works for signed-in users hitting `/app`-style paths (keep as-is, but landing takes priority for `/`).

## 2. Fix "Insight generation failed" toast

The dashboard auto-calls `askNexova` on mount before the Supabase session bearer is attached → 401 → toast fires. Fix:

- In `src/routes/_app/dashboard.tsx`, only call `generateInsight()` after `user` is present and after first data load completes (chain off `load()` success), and remove the auto-fire on mount.
- Make `generateInsight` silent on failure (no toast) and show a clean "AI temporarily unavailable — using rule-based summary" inline instead.
- In `src/lib/ai.functions.ts` `askNexova`, also return rule-based result on any unexpected gateway error (already mostly there) so the serverFn never throws to the client.

## 3. Security findings

### a. Restrict `sales_records` INSERT to admins
Drop `sales_write_auth` (WITH CHECK true) and replace with admin-only insert policy via `has_role(auth.uid(), 'admin')`. Mark `SUPA_rls_policy_always_true` + `UNRESTRICTED_INSERT_SALES` fixed.

### b. SECURITY DEFINER function exposure
`has_role()` and `handle_new_user()` are `SECURITY DEFINER` and currently executable by `anon` / `authenticated`. Migration:
- `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;` (trigger only — no app caller needs it)
- `REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;` (keep `authenticated` since RLS policies invoke it as the calling user)

### c. `user_roles` bootstrap warning
Informational only — `handle_new_user()` already promotes the first user to admin. Mark as ignored with explanation.

## 4. Verification

- Confirm `/` renders the new landing without auth redirect.
- Sign in → `/dashboard` loads, insight either renders or silently falls back, no error toast.
- Re-run security scan and mark resolved findings fixed.

## Technical notes

Files touched:
- `src/routes/index.tsx` (new)
- `src/routes/_app/dashboard.tsx` (insight call gating)
- `src/lib/ai.functions.ts` (defensive error handling — minor)
- new supabase migration (RLS + function GRANTs)
