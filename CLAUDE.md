# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server (port 3000; iCloud sync can corrupt .next — see Gotchas)
npx tsc --noEmit  # type-check without building
npm run build     # production build (runs before every Vercel deploy)
```

No test suite is configured. Type-checking with `tsc --noEmit` is the main correctness gate.

## Architecture

**Stack:** Next.js 15 App Router · TypeScript · Supabase (Auth + Postgres + RLS) · Tailwind CSS · Stripe

### Route groups → layouts

| Group | Layout | Auth behaviour |
|-------|--------|---------------|
| `(public)` | Header + Footer + BottomNav (when logged in) | Open |
| `(auth)` | Centered card | Open |
| `(member)` | Header + BottomNav | Redirects to `/login` if no session |
| `admin` | Admin sidebar | Redirects to `/` if `profiles.role ≠ 'admin'` |

### Auth & session

- `lib/supabase/server.ts` — exports `createClient()` (SSR-safe) and `getUser()` (React-`cache()`d). **Always use `getUser()` instead of `supabase.auth.getUser()` in server components** — it deduplicates the network call across layout + page.
- `lib/supabase/middleware.ts` — refreshes session cookies and enforces `MEMBER_PREFIXES` + admin gate.
- Admin gate runs a service-role REST fetch (RLS-independent) in middleware. Any future admin policy must use the `public.is_admin()` SECURITY DEFINER function, never an inline `profiles` subquery (causes RLS recursion, PG error 42P17).

### Data access patterns

- **Server components** (dashboard, briefings, etc.) — `const [user, supabase] = await Promise.all([getUser(), createClient()])` then `Promise.all([...queries])` for parallel fetching.
- **Client components** (schedule, settings) — `createClient()` from `@/lib/supabase/client` directly.
- **Mutations** — Server Actions in `actions/` (e.g. `actions/bookmark.ts`) for simple mutations; direct Supabase browser-client calls for complex client-side forms.

### Design system (Antigravity)

Custom Tailwind tokens defined in `tailwind.config.ts` + `app/globals.css`:
- **Colors:** `azure-{50–900}` (brand blue), `surface-{0,50,100,border}` (backgrounds/borders)
- **Shadows:** `shadow-card`, `shadow-card-hover`, `shadow-cta`, `shadow-cta-hover`
- **Gradients:** `bg-hero-gradient`, `bg-cta-gradient`, `bg-azure-gradient`
- **Component classes:** `.btn-primary`, `.btn-outline`, `.btn-ghost-white`, `.card-lift`, `.section-eyebrow`
- **Animations:** `animate-fade-up`, `animate-fade-up-{1,2,3}`, `animate-fade-in`

Use these tokens instead of raw Tailwind colors where possible.

### Key shared types (`types/index.ts`)

`Profile`, `ContentItem`/`ContentSummary`, `Subscription`, `ScheduleEvent`, `ChildProfile`, `InterestTag`, `Bookmark`

`ScheduleEvent.is_recurring + recur_days` (int[] of JS day-of-week 0–6) drives the weekly planner. Recurring events use `start_at` only for the time portion; the date is a placeholder (`2000-01-01`).

### Stripe

`lib/stripe/client.ts` exports a nullable singleton (`stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(...) : null`). All Stripe call sites must null-check before use. Webhook handler at `app/api/webhooks/stripe/route.ts` handles `checkout.session.completed`, `customer.subscription.{created,updated,deleted}` and writes to the `subscriptions` table via service-role client.

### Child colours

Shared palette in `lib/child-colors.ts` (`DOT_COLOR`, `BADGE_COLOR`, `CHILD_COLORS`). Import from here — don't redefine inline.

## Gotchas

- **iCloud + `.next`:** Desktop is iCloud-synced. iCloud races `next dev` writing `.next/` → corrupts the build manifest. Fix: `rm -rf .next tsconfig.tsbuildinfo`, restart **one** dev server. Never run two `next dev` processes simultaneously.
- **RLS self-recursion (PG 42P17):** Any policy ON `profiles` that subqueries `profiles` recurses for authenticated reads. Use `public.is_admin()` SECURITY DEFINER instead.
- **`@/` path alias** maps to the project root (not `app/`). Server Actions live in `actions/`, not `app/actions/`.
- **Supabase migrations** in `supabase/migrations/` are run manually in the Supabase SQL editor — there is no CLI migration runner configured.
