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
