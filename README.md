# Pablo Auto's

A mobile-first garage management app for independent mechanics. Track jobs, customers, schedules, stock, and invoices — built for UK sole traders.

## Features

- **Overview Dashboard** — Today's jobs, weekly revenue, outstanding payments, needs attention
- **Job Management** — Labour and parts line items, enforced status workflow, scheduling
- **Customers & Vehicles** — Directory with DVLA lookup, MOT data, edit/delete
- **Invoicing** — UK non-VAT template, overdue tracking, print and share
- **Money** — Workshop earnings plus stock sale profit
- **Stock** — Cars for resale with parts and profit tracking
- **Sign-in** — Username + password with rate limiting and encrypted sessions

## Quick Start

```bash
npm install
cp .env.example .env   # set DATABASE_URL, AUTH_SECRET, and ADMIN_PASSWORD
npm run db:migrate:deploy
npm run db:seed        # optional demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with your credentials from `.env`.

For a local Postgres instance with Docker:

```bash
docker run --name pablo-garage-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pablo_garage -p 5432:5432 -d postgres:16
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pablo_garage"` in `.env`.

## Environment

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
AUTH_SECRET="..."           # openssl rand -base64 48
ADMIN_USERNAME="Pablo"
ADMIN_PASSWORD="..."        # remove after first setup in production
DVLA_API_KEY="..."          # optional
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run dev:clean` | Clear `.next` cache and start dev |
| `npm run build` | Production build |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production/CI) |
| `npm run db:push` | Sync schema without migrations (emergency only) |
| `npm run db:seed` | Demo data |
| `npm test` | Run tests |

## Tech Stack

- **Next.js 15** — App Router
- **Tailwind CSS 4** — Mobile-first UI
- **Prisma** — PostgreSQL
- **Zod** — API validation
- **iron-session + bcrypt** — Authentication

## UK Specifics

- GBP currency formatting (`en-GB`)
- DD/MM/YYYY dates, Monday-start weeks
- DVLA registration lookup with MOT persistence
- Non-VAT invoice footer in default template

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production database setup, migrations, and security checklist.

## Project Structure

```
src/
  app/           # Pages and API routes
  components/    # UI components
  lib/           # Auth, validation, money, utilities
prisma/
  schema.prisma  # Database schema
  seed.ts        # Demo data
```

## License

Private — Pablo Auto's
