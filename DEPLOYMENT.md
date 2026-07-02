# Deployment Guide — Pablo Auto's

## Before you deploy

1. **MySQL database** — Create a database on [Railway](https://railway.app), [PlanetScale](https://planetscale.com), or any MySQL 8 host.

2. **Set environment variables** on your host:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | MySQL connection string (`mysql://...`) |
| `AUTH_SECRET` | Yes | 32+ random chars (`openssl rand -base64 48`) |
| `ADMIN_USERNAME` | First setup | Default `Pablo` |
| `ADMIN_PASSWORD` | First setup | Hashed on first login; remove after setup |
| `DVLA_API_KEY` | Optional | UK registration lookup |

3. **Run migrations** during deploy:

```bash
npx prisma migrate deploy
```

## Railway MySQL

On Railway, set on the app service:

```env
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

## Local development

```bash
npm install
cp .env.example .env
npm run db:migrate:deploy
npm run db:seed   # optional
npm run dev
```

Local Docker MySQL:

```bash
docker run --name pablo-garage-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=pablo_garage -p 3306:3306 -d mysql:8
```

Then set `DATABASE_URL="mysql://root:root@localhost:3306/pablo_garage"` in `.env`.

## Seed data

```bash
npm run db:seed
```

To reset admin password via seed (avoid on production):

```bash
SEED_RESET_AUTH=true npm run db:seed
```

## Hosting options

| Platform | Notes |
|----------|-------|
| **Railway** | App + MySQL in one project |
| **Vercel + PlanetScale** | Set `DATABASE_URL` to PlanetScale URL |
| **VPS** | `npm run build && npm start` with MySQL |

## Security checklist

- [ ] Strong `AUTH_SECRET` and admin password
- [ ] HTTPS enabled (host handles this)
- [ ] Remove `ADMIN_PASSWORD` from env after first login
- [ ] Do not commit `.env`
- [ ] Regular database backups

## Build command

```bash
npm install && npx prisma migrate deploy && npm run build
```

Start command:

```bash
npx prisma migrate deploy && npm start
```
