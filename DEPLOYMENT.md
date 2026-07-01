# Deployment Guide — Pablo Auto's

## Before you deploy

1. **Use a persistent database** — SQLite (`file:./dev.db`) is fine for local dev only. For production, use PostgreSQL (Neon, Supabase, Railway) or [Turso](https://turso.tech) (libSQL).

2. **Set environment variables** on your host:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string in production |
| `AUTH_SECRET` | Yes | 32+ random chars (`openssl rand -base64 48`) |
| `ADMIN_USERNAME` | First setup | Default `Pablo` |
| `ADMIN_PASSWORD` | First setup | Hashed on first login; remove after setup |
| `DVLA_API_KEY` | Optional | UK registration lookup |

3. **Run migrations** (recommended for production):

```bash
npx prisma migrate deploy
```

For local development you can still use:

```bash
npm run db:push
```

## Switching to PostgreSQL

1. Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.
2. Set `DATABASE_URL` to your Postgres URL.
3. Create and apply migrations:

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy   # on production
```

4. Seed demo data only on a fresh install:

```bash
npm run db:seed
```

To reset the admin password via seed (avoid on production):

```bash
SEED_RESET_AUTH=true npm run db:seed
```

## Backups

- **SQLite (dev):** copy `prisma/dev.db` regularly.
- **Postgres:** use your provider's automated backups (Neon/Supabase include these).

## Hosting options

| Platform | Notes |
|----------|-------|
| **Vercel + Neon** | Set `DATABASE_URL`, run `prisma migrate deploy` in build |
| **Railway / Render** | Attach Postgres volume; set env vars |
| **VPS** | `npm run build && npm start` with persistent disk for DB |

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
