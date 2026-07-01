# Deployment Guide — Pablo Auto's

## Before you deploy

1. **PostgreSQL database** — Create a database on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app).

2. **Set environment variables** on your host:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | 32+ random chars (`openssl rand -base64 48`) |
| `ADMIN_USERNAME` | First setup | Default `Pablo` |
| `ADMIN_PASSWORD` | First setup | Hashed on first login; remove after setup |
| `DVLA_API_KEY` | Optional | UK registration lookup |

3. **Run migrations** during deploy:

```bash
npx prisma migrate deploy
```

## Neon + Vercel notes

If Neon gives you a pooled connection URL for `DATABASE_URL`, also add `DIRECT_URL` with the direct (non-pooler) connection string and add this to `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Migrations use `DIRECT_URL`; the app uses the pooled `DATABASE_URL`.

## Local development

```bash
npm install
cp .env.example .env
npm run db:migrate:deploy
npm run db:seed   # optional
npm run dev
```

## Seed data

Demo data for a fresh install:

```bash
npm run db:seed
```

To reset the admin password via seed (avoid on production):

```bash
SEED_RESET_AUTH=true npm run db:seed
```

## Backups

Use your Postgres provider's automated backups (Neon/Supabase/Railway include these).

## Hosting options

| Platform | Notes |
|----------|-------|
| **Vercel + Neon** | Set env vars; run `prisma migrate deploy` in build |
| **Railway** | Attach Postgres; set env vars in dashboard |
| **Render** | Attach Postgres volume; set env vars |

## Security checklist

- [ ] Strong `AUTH_SECRET` and admin password
- [ ] HTTPS enabled (host handles this)
- [ ] Remove `ADMIN_PASSWORD` from env after first login
- [ ] Do not commit `.env`
- [ ] Regular database backups

## Build command

Most hosts can use:

```bash
npm install && npx prisma migrate deploy && npm run build
```

Start command:

```bash
npm start
```
