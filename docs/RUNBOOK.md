# El Pitazo — Operations Runbook

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Environment Variables](#environment-variables)
3. [Deployment](#deployment)
4. [Database (Neon)](#database-neon)
5. [Rollback Procedure](#rollback-procedure)
6. [Common Errors & Fixes](#common-errors--fixes)
7. [Monitoring & Alerts](#monitoring--alerts)

---

## Architecture Overview

| Layer | Service |
|-------|---------|
| Frontend + API | Next.js on Vercel |
| Database | Neon (Postgres, serverless) |
| ORM | Prisma |
| Payments | MercadoPago (OXXO, SPEI, MP) |
| Auth | NextAuth.js (Google, Apple, email) |
| Media | Vercel Blob |
| Push | Web Push (VAPID) |
| Error tracking | Sentry |

---

## Environment Variables

All required environment variables are documented in `.env.example`.  
Copy it and fill in secrets before deploying:

```bash
cp .env.example .env.local   # local dev
```

### Mandatory for production

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Neon dashboard → Project → Connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://elpitazo.app` |
| `MP_SECRET_KEY` | MercadoPago → Credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Blob → your store |
| `SENTRY_DSN` | Sentry project → Settings → Client Keys |

---

## Deployment

### Normal deploy (Vercel)

Pushes to `main` auto-deploy via Vercel CI.

1. Merge PR to `main`.
2. Vercel picks it up automatically.
3. Watch **Vercel Dashboard → Deployments** for build logs.

### Manual deploy

```bash
vercel --prod
```

### Post-deploy checks

```bash
# Smoke-test key endpoints
curl -sf https://elpitazo.app/api/health && echo "OK"
curl -sf https://elpitazo.app/api/tournaments | jq '.length'
```

### Run DB migrations after deploy

```bash
# From local machine against production DB
DATABASE_URL="<neon-prod-url>" npx prisma migrate deploy
```

---

## Database (Neon)

### Access

- Console: <https://console.neon.tech>  
- Connection string: Neon → Project → Connection string → `postgresql://...`

### Run a one-off query

```bash
DATABASE_URL="<neon-url>" npx prisma db execute --stdin <<'SQL'
SELECT count(*) FROM tournaments WHERE status = 'ACTIVE';
SQL
```

### Backup / snapshot

Neon creates automatic branch snapshots. To create a manual branch for safe schema changes:

```bash
# via Neon CLI
neonctl branches create --name backup-$(date +%Y%m%d) --project-id <project-id>
```

### Connection pooling

Use **pgbouncer** mode for serverless:  
`postgresql://user:pass@ep-xxx.pooler.neon.tech/neondb?pgbouncer=true&connection_limit=1`

---

## Rollback Procedure

### Application rollback (Vercel)

1. Vercel Dashboard → Deployments.
2. Find last good deployment.
3. Click **...** → **Promote to Production**.

### Database rollback

Prisma does not auto-generate down migrations. Steps:

1. Create a new Neon branch from the snapshot taken before the bad migration.
2. Point `DATABASE_URL` to the branch.
3. Fix the migration file, re-run `npx prisma migrate deploy`.
4. Swap `DATABASE_URL` back.

---

## Common Errors & Fixes

### `PrismaClientInitializationError: Can't reach database server`

- Check `DATABASE_URL` in Vercel env vars.
- Neon project may be in auto-suspend: it auto-wakes on first query (cold start ~2 s). If timing out, increase serverless function timeout in `next.config.js`.

### `Error: NEXTAUTH_SECRET is not set`

- Add `NEXTAUTH_SECRET` to Vercel → Settings → Environment Variables.

### `MercadoPago 401 Unauthorized`

- `MP_SECRET_KEY` is wrong or expired. Regenerate in MercadoPago Dashboard → Credentials.

### Orphaned MercadoPago payment (OXXO / SPEI)

Logged as:
```json
{"level":"error","message":"OXXO DB insert failed — orphaned MP payment","mpPaymentId":"..."}
```

Fix:
```sql
-- Manually insert the payment row using the mpPaymentId from logs
INSERT INTO payments (id, tournament_id, team_id, user_id, amount, currency, method, status, external_id, created_at)
VALUES (gen_random_uuid(), '...', '...', '...', 0, 'MXN', 'OXXO', 'PENDING', '<mpPaymentId>', now());
```

### `Circuit open: <service>`

A downstream service failed 3× in a row.  
- Check service health (MercadoPago status page, Neon status).
- Circuit auto-resets after 30 seconds.

### Web Push `410 Gone`

The user's push subscription has expired. Delete it:
```sql
DELETE FROM push_subscriptions WHERE endpoint = '<endpoint>';
```

---

## Monitoring & Alerts

| Tool | URL |
|------|-----|
| Vercel logs | <https://vercel.com/dashboard> → Project → Functions logs |
| Sentry | <https://sentry.io> |
| Neon metrics | <https://console.neon.tech> → Metrics |
| MercadoPago | <https://www.mercadopago.com.mx/developers/panel> |

### Key metrics to watch

- **p95 API latency** > 3 s → investigate slow queries (add `EXPLAIN ANALYZE`).
- **DB connection errors** → likely connection pool exhaustion; check `connection_limit`.
- **Payment failure rate** > 5% → check MercadoPago credentials and webhook logs.
- **Sentry error spike** → check latest deploy, consider rollback.
