# Railway setup — Pablo Garage

## 0. Connect GitHub (required)

If deploy logs still show `provider = "sqlite"` or `next start` only, Railway is not building latest `main`.

1. App service → **Settings** → **Source**
2. Connect **GitHub** → repo **`xTeaqah/Pablo-Garage`**
3. Branch: **`main`**
4. **Clear custom start/build commands** in Settings → Deploy (leave blank so `Dockerfile` / `railway.toml` are used)
5. Save, then run: `npx @railway/cli redeploy --from-source --yes`

The repo includes `Dockerfile`, `railway.toml`, and `nixpacks.toml`.

## 1. Services you need

In one Railway project:

- **Pablo-Garage** (or similar) — the app from GitHub
- **Postgres** — add via **+ New** → **Database** → **PostgreSQL**

## 2. App variables (critical)

Open the **app service** → **Variables**. Set:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
AUTH_SECRET=VMS1cb0PCe4Y2vmvwgVr7p1aBmX/Y+S40HeNMUhmJ08R6S/4skwsFNUw6Ib6dTp0
ADMIN_USERNAME=Pablo
ADMIN_PASSWORD=PabloMo123
DVLA_API_KEY=RShAhpZ0w78QVIWJK1cXB6pD6stx9urO4CaCx154
```

**Important:** `DATABASE_URL` must reference Railway Postgres — **never** use `localhost`.

If your Postgres service is not named `Postgres`, check the exact name in the sidebar and use:

```env
DATABASE_URL=${{YourPostgresServiceName.DATABASE_URL}}
```

## 3. Build and start

The repo includes `railway.toml`. After connecting GitHub, Railway should use:

- **Build:** `npm install && npx prisma migrate deploy && npm run build`
- **Start:** `npx prisma migrate deploy && npm start`

If not, set these manually under the app service **Settings**.

## 4. Redeploy

After saving variables: **Deployments** → **Redeploy**.

## 5. Verify

1. Open `https://YOUR-APP.up.railway.app/api/health`
   - Success: `"ok": true, "database": "connected"`
   - Failure: shows the real database error
2. Sign in at `/login` with `Pablo` / `PabloMo123`
3. Remove `ADMIN_PASSWORD` from Railway variables after first login

## Common mistakes

| Problem | Fix |
|---------|-----|
| Login shows "Something went wrong" | `DATABASE_URL` still points at `localhost` |
| Health shows `P1001` / connection refused | Postgres not attached or wrong URL |
| Wrong password after env change | Password is stored hashed in DB; reset with new deploy + empty Settings row, or set `SEED_RESET_AUTH=true` and run seed once |
