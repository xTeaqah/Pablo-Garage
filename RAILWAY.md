# Railway setup — Pablo Garage

## MySQL has no tables

The database is empty until migrations run once.

**Option A — Railway app shell**

1. Open your **app** service (Pablo-Garage)
2. Open the service **shell/terminal**
3. Run:

```bash
npx prisma migrate deploy
```

**Option B — From your Mac**

1. Railway → **MySQL** → **Connect** → copy `MYSQL_URL`
2. Run:

```bash
cd "/Users/stinky/Documents/projects/Mo's Garage"
DATABASE_URL="paste-mysql-url-here" npm run db:migrate:deploy
```

**Option C — Railway CLI**

```bash
cd "/Users/stinky/Documents/projects/Mo's Garage"
npx @railway/cli login
npx @railway/cli link
npx @railway/cli run npx prisma migrate deploy
```

## Services you need

In one Railway project:

- **Pablo-Garage** — the app from GitHub
- **MySQL** — add via **+ New** → **Database** → **MySQL**

## App variables

Open the **app service** → **Variables**:

```env
DATABASE_URL=${{MySQL.MYSQL_URL}}
AUTH_SECRET=VMS1cb0PCe4Y2vmvwgVr7p1aBmX/Y+S40HeNMUhmJ08R6S/4skwsFNUw6Ib6dTp0
ADMIN_USERNAME=Pablo
ADMIN_PASSWORD=PabloMo123
DVLA_API_KEY=RShAhpZ0w78QVIWJK1cXB6pD6stx9urO4CaCx154
```

Prisma reads `DATABASE_URL`. On Railway, point it at the MySQL service URL.

If your MySQL service has a different name:

```env
DATABASE_URL=${{YourMySQLServiceName.MYSQL_URL}}
```

Or paste the full `mysql://...` URL from the MySQL service **Connect** tab.

## Build and redeploy

The repo includes `Dockerfile` and `railway.toml`. After saving variables:

1. Clear any custom build/start commands in **Settings → Deploy**
2. **Deployments** → **Redeploy** (or `npx @railway/cli redeploy --from-source --yes`)

## Verify

1. `https://YOUR-APP.up.railway.app/api/health` → `"database": "connected"`
2. Sign in at `/login` with `Pablo` / `PabloMo123`
