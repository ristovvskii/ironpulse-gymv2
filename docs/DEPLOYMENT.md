# Demo deployment (RepoRun / Docker)

> **Demo deployments only.** The demo accounts below have a public, well-known password. Never enable `AUTO_SEED_DEMO_USERS` on a real production system.

## Start sequence

`pnpm --filter api start` (also run by the root `pnpm start`) executes [apps/api/scripts/start-prod.cjs](../apps/api/scripts/start-prod.cjs):

1. `prisma migrate deploy` — fatal on failure (the API does not start).
2. Demo seed (`dist/src/demo/seed-demo.js`) — runs only when `AUTO_SEED_DEMO_USERS=true`. A seed failure is logged and the API **still boots** (non-fatal by design).
3. API (`dist/src/main.js`).

The seed uses compiled JS, `argon2` and `@prisma/client` only (no ts-node). It can also be run manually: `pnpm --filter api seed:demo`.

## Demo accounts

Defined once in [apps/api/src/demo/demo-accounts.ts](../apps/api/src/demo/demo-accounts.ts). Password `password123`.

| Email | Role |
| --- | --- |
| `admin@ironpulse.test` | ADMIN |
| `member@ironpulse.test` | MEMBER |
| `trainer@ironpulse.test` | TRAINER (with trainer profile) |
| `sponsor@ironpulse.test` | SPONSOR (with sponsor profile) |

Each user (plus its profile rows) is created in one transaction. Existing users are never modified, so re-running or concurrent runs are safe (a unique-constraint race is treated as "exists"). Passwords and hashes are never logged.

`apps/api/prisma/seed.ts` (the full local dev seed, refuses to run in production) uses the same emails and overwrites those rows when run locally; the two are not meant to be combined on one database.

## Build and start commands

- Build: `pnpm install --frozen-lockfile && pnpm --filter @ironpulse/shared build && pnpm --filter api exec prisma generate && pnpm build`
- Start: `pnpm start` (API + web) or `pnpm --filter api start` (API only)

## Environment variables (API)

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `DATABASE_URL` | yes | SQLite, e.g. `file:/data/ironpulse.db` (use a persistent absolute path) |
| `JWT_SECRET` | yes | random, at least 32 characters |
| `AUTO_SEED_DEMO_USERS` | no | `true` to seed demo users; default `false` |
| `PORT` | no | default `4000` |
| `CORS_ORIGINS`, `WEB_URL`, `WEB_APP_URL` | yes for a real web origin | exact allow-list of the deployed web origin |
