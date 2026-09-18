# AI-Powered Job Application Platform — Architecture

Senior-staff-level reference architecture. This document + the accompanying source
files under `src/` and `prisma/` form a working scaffold: auth, database schema,
repository layer, resume parsing, ATS scoring, four AI features, the job tracker,
and the dashboard are implemented end-to-end as real, runnable modules. Everything
else (every remaining screen, every test, full CI/CD) follows the same patterns
established here and is called out in the implementation plan so a team can
finish it in parallel work-streams.

---

## 1. High-Level Architecture

```
                          ┌─────────────────────────────────────────┐
                          │              Client (Browser)            │
                          │  Next.js App Router (RSC + Client Comp.) │
                          │  Zustand (UI/local state) + React Query  │
                          └───────────────┬───────────────────────────┘
                                          │ Server Actions / Route Handlers
                          ┌───────────────▼───────────────────────────┐
                          │            Next.js Server Runtime          │
                          │  - Server Actions (mutations)              │
                          │  - Route Handlers (webhooks, file, cron)   │
                          │  - Middleware (auth guard, RBAC, locale)   │
                          │  - NextAuth (session/JWT)                  │
                          └───────┬─────────────────┬──────────────────┘
                                  │                 │
                    ┌─────────────▼───────┐  ┌──────▼───────────────┐
                    │   Repository Layer   │  │   Feature Services    │
                    │ (Prisma-backed CRUD) │  │ (ATS engine, AI calls)│
                    └─────────────┬────────┘  └──────┬────────────────┘
                                  │                  │
                    ┌─────────────▼──────────┐ ┌─────▼─────────────┐
                    │   PostgreSQL (Supabase) │ │   OpenAI API       │
                    │   via Prisma ORM        │ │   Resend Email     │
                    └─────────────────────────┘ │   Supabase Storage │
                                                 └────────────────────┘
```

**Core principles applied throughout:**
- **Feature-based folders**, not type-based — each feature owns its actions,
  components, schemas, and hooks.
- **Repository Pattern** — Prisma is never called directly from actions/UI;
  all persistence goes through `src/repositories/*`, which the AI/ATS/dashboard
  services and Server Actions depend on. This keeps Prisma swappable and makes
  unit testing trivial (mock the repository, not the DB).
- **Server Actions** for all mutations (upload resume, create application,
  update status, generate cover letter). Route Handlers are reserved for things
  that aren't simple form mutations: NextAuth, file streaming, Resend webhooks,
  and cron-triggered reminder jobs.
- **Zod** is the single source of truth for validation — the same schema
  validates the form on the client (via React Hook Form's resolver) and the
  Server Action input on the server.
- **React Query** owns *server cache* (applications list, ATS history,
  dashboard analytics). **Zustand** owns *ephemeral UI state* (active Kanban
  column being dragged, resume upload wizard step, modal open state). This
  split avoids the classic anti-pattern of duplicating server data into a
  global client store.

---

## 2. Folder Structure

```
ai-job-platform/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ register/page.tsx
│  │  ├─ (dashboard)/                     # protected route group
│  │  │  ├─ layout.tsx                    # session check + shell
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ resumes/page.tsx
│  │  │  ├─ resumes/[id]/page.tsx
│  │  │  ├─ jobs/page.tsx                 # Kanban tracker
│  │  │  ├─ ai-tools/cover-letter/page.tsx
│  │  │  ├─ ai-tools/interview-prep/page.tsx
│  │  │  └─ ai-tools/job-match/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ cron/reminders/route.ts       # Vercel Cron target
│  │  │  └─ webhooks/resend/route.ts
│  │  ├─ error.tsx                        # global error boundary
│  │  ├─ not-found.tsx
│  │  ├─ layout.tsx                       # root layout, SEO defaults
│  │  └─ sitemap.ts / robots.ts
│  ├─ features/
│  │  ├─ auth/            (schemas, getSession helper, RBAC guard)
│  │  ├─ resume/          (actions, parser service, components)
│  │  ├─ ats/             (analyzer service, keyword extraction)
│  │  ├─ ai/              (cover-letter, interview-qs, job-match services)
│  │  ├─ jobs/            (actions, Kanban components)
│  │  ├─ dashboard/       (analytics aggregation, chart components)
│  │  └─ notifications/   (email templates, reminder scheduler)
│  ├─ repositories/       (user, resume, application, ats-result repos)
│  ├─ lib/                (db.ts, auth.ts, openai.ts, resend.ts, storage.ts,
│  │                       validations.ts, rbac.ts, utils.ts)
│  ├─ components/
│  │  ├─ ui/              (shadcn primitives)
│  │  └─ shared/          (AppShell, Navbar, EmptyState, ErrorState)
│  ├─ store/              (useUiStore.ts, useJobBoardStore.ts)
│  ├─ hooks/               (useApplications.ts, useResume.ts, useDashboard.ts)
│  ├─ types/               (shared TS types / Prisma type extensions)
│  ├─ emails/              (React Email templates for Resend)
│  └─ tests/               (vitest unit + RTL component tests)
├─ middleware.ts
├─ next.config.ts
├─ package.json
└─ .env.example
```

---

## 3. Database Schema — Design Notes

See `prisma/schema.prisma` for the full schema. Key decisions:

- `User` → `Resume` is 1-to-many (a user can keep multiple resume versions);
  `Resume` → `ResumeVersion`-style history is modeled via `ats_analyses` linking
  to a specific resume so ATS score trends can be charted over time even as a
  resume is edited.
- `JobApplication` holds the Kanban `status` enum (`WISHLIST`, `APPLIED`,
  `INTERVIEW`, `OFFER`, `REJECTED`) plus a `statusHistory` join table
  (`ApplicationStatusEvent`) so the dashboard can compute "time in stage" and
  weekly activity without recomputing from audit logs.
- `AIGeneration` is a generic polymorphic-ish table (`type` enum: cover_letter,
  interview_questions, job_match) storing prompt/response/tokens so usage is
  auditable and cacheable (avoid re-billing OpenAI for an unchanged
  resume+job pair — see `ai/cache.ts` pattern in the analyzer).
- Composite indexes on `(userId, status)` and `(userId, createdAt)` are added
  everywhere the dashboard aggregates, since those are the hot query paths.
- `Notification` table decouples "what reminder is due" from "did we send the
  email" (`sentAt`), so the cron job is idempotent and retry-safe.

---

## 4. API / Server Action Design

All mutations are Server Actions (colocated in each feature's `actions.ts`),
returning a discriminated union `{ success: true, data } | { success: false, error }`
so the client never has to `throw`/`catch` across the server boundary.

| Action | Feature | Description |
|---|---|---|
| `uploadResumeAction(formData)` | resume | Streams file to Supabase Storage, enqueues parse |
| `parseResumeAction(resumeId)` | resume | Calls OpenAI to extract structured fields |
| `runAtsAnalysisAction(resumeId, jobDescription?)` | ats | Scores resume, returns gaps |
| `generateCoverLetterAction(input)` | ai | Streams cover letter text |
| `generateInterviewQuestionsAction(input)` | ai | Returns structured Q&A list |
| `computeJobMatchAction(resumeId, jobDescription)` | ai | Returns 0–100 match + rationale |
| `createApplicationAction(input)` | jobs | Adds job to Wishlist |
| `updateApplicationStatusAction(id, status)` | jobs | Moves card, writes status event |
| `getDashboardAnalyticsAction(range)` | dashboard | Aggregates counts/trends (cached via React Query) |

Route Handlers (`src/app/api/...`) are used only for: NextAuth, the Resend
delivery webhook (updating `Notification.sentAt`/bounce status), and the
Vercel Cron endpoint that scans for due interview reminders.

---

## 5. UI Screens

1. **/login, /register** — credentials + Google OAuth, RHF + Zod, shadcn `Form`.
2. **/dashboard** — stat cards (applications count, avg ATS score), ATS trend
   line chart, weekly activity bar chart, recent applications table.
3. **/resumes** — upload dropzone, list of parsed resumes with ATS score chip.
4. **/resumes/[id]** — parsed data viewer (skills/experience/education/projects),
   "Run ATS Analysis" panel with missing-keywords chips and suggestions.
5. **/jobs** — 5-column Kanban (Wishlist → Applied → Interview → Offer →
   Rejected), drag-and-drop status change, per-card AI Job Match badge.
6. **/ai-tools/cover-letter** — resume + job description input → streamed
   generated letter, editable, export.
7. **/ai-tools/interview-prep** — job description → generated question bank,
   grouped by category (behavioral/technical/company-specific).
8. **/ai-tools/job-match** — resume vs JD → match score gauge + rationale.

---

## 6. Step-by-Step Implementation Plan

**Phase 0 — Foundations (Day 1–2)**
1. `create-next-app` (App Router, TS, Tailwind) → install shadcn, configure theme.
2. Provision Supabase project (Postgres + Storage bucket `resumes`).
3. `prisma init`, paste schema, `prisma migrate dev`, `prisma db seed`.
4. Configure NextAuth (Credentials + Google providers), Prisma adapter.
5. Set up `.env`, `lib/db.ts` singleton, `middleware.ts` route protection.

**Phase 1 — Auth & RBAC (Day 3–4)**
6. Build login/register pages, RHF+Zod forms, password hashing (bcrypt).
7. Implement `rbac.ts` (`requireRole`) and protected `(dashboard)` layout.

**Phase 2 — Resume Upload & Parsing (Day 5–7)**
8. Upload Server Action → Supabase Storage → `Resume` row (status: `PENDING`).
9. Parsing service: extract text (pdf-parse / mammoth for docx) → OpenAI
   structured-extraction prompt (JSON mode) → persist structured fields.
10. Resume list/detail UI with React Query hooks.

**Phase 3 — ATS Analysis (Day 8–9)**
11. Keyword-extraction + scoring algorithm (deterministic, not just an LLM
    call — combine TF-IDF-style keyword match against JD with an OpenAI pass
    for qualitative suggestions). Persist `AtsAnalysis` for trend charting.

**Phase 4 — AI Features (Day 10–12)**
12. Cover letter generator (streaming via `ai` SDK or raw OpenAI streaming).
13. Interview question generator (JSON-mode structured output).
14. Job match score service (shared scoring core with ATS module).

**Phase 5 — Job Tracker & Dashboard (Day 13–15)**
15. Kanban board (dnd-kit), Server Actions for create/update/delete.
16. Dashboard aggregation queries + Recharts visualizations.

**Phase 6 — Notifications (Day 16)**
17. Resend integration, React Email templates, Vercel Cron for interview
    reminders (T-24h) and weekly ATS re-check nudges.

**Phase 7 — Hardening (Day 17–20)**
18. Error boundaries + loading.tsx per route segment, empty states.
19. SEO: metadata API, sitemap.ts, robots.ts, OG images.
20. Vitest unit tests (repositories, ATS scoring, Zod schemas) + RTL tests
    (forms, Kanban card move). Target: repository & scoring logic ≥ 90% coverage.
21. Deploy: Vercel project + Supabase production branch, run migrations in CI,
    set env vars, smoke test OAuth callback URLs.

---

## 7. What's Implemented in This Scaffold vs. Left as an Exercise

**Fully implemented (real, working code in this delivery):**
Prisma schema, NextAuth config + middleware RBAC, repository layer (user,
resume, application, ATS), resume upload + parsing service, ATS scoring
engine, all three AI generation services, job tracker Server Actions +
Zustand store, dashboard analytics aggregation + React Query hook, one
fully coded screen (`/jobs` Kanban) and the dashboard page, Zod validation
schemas, Resend email templates, and one Vitest suite demonstrating the
testing pattern.

**Follow the same pattern to complete:** the remaining screens
(`/resumes`, `/ai-tools/*`, `/login`, `/register`) are straightforward
RHF+Zod forms over the Server Actions already written — wire a shadcn
`<Form>` to each action shown above. CI/CD pipeline (GitHub Actions →
Vercel) and full test coverage are mechanical extensions of the patterns
in `src/tests/`.
