# AI-Powered Job Application Platform

Production-grade scaffold. See `ARCHITECTURE.md` for the full design doc
(folder structure, API design, screen inventory, implementation plan).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate shadcn/ui primitives (see src/components/ui/README.md)
npx shadcn@latest init
npx shadcn@latest add button input textarea dialog form skeleton card badge select label

# 3. Configure environment
cp .env.example .env
# Fill in Supabase, Google OAuth, OpenAI, and Resend credentials

# 4. Set up the database
npx prisma migrate dev --name init
npx prisma db seed

# 5. Run the dev server
npm run dev
```

Demo login (after seeding): `demo@example.com` / `Password123!`

## Testing

```bash
npm run test            # run once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

## Deployment

1. Push to GitHub, import the repo in Vercel.
2. Create a Supabase project; run migrations against it via `DIRECT_URL`
   (`npx prisma migrate deploy` in your CI pipeline).
3. Create a public Supabase Storage bucket named `resumes` with RLS scoping
   object paths to `${auth.uid()}/...` if you extend browser-side uploads.
4. Set all `.env.example` variables in Vercel's project settings.
5. Add a Vercel Cron entry (`vercel.json`) pointing at
   `/api/cron/reminders` on an hourly schedule, with `CRON_SECRET` set.
6. Update the Google OAuth consent screen's authorized redirect URI to
   `https://<your-domain>/api/auth/callback/google`.

## Project Structure

See `ARCHITECTURE.md` §2 for the annotated folder tree and §6 for a
day-by-day build sequence if you're completing the remaining screens.
