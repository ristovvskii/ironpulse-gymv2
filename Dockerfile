FROM node:20-slim AS base
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- build: full workspace with dev dependencies ----
FROM base AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

# Only port 3000 is exposed by RepoRun. The browser calls the API same-origin at /api,
# which Next.js proxies to the API inside the container (see apps/web/next.config.mjs).
# Both values are baked in at build time.
ENV NEXT_PUBLIC_API_URL="/api"
ENV API_INTERNAL_URL="http://127.0.0.1:4000"

RUN pnpm --filter api exec prisma generate
# One package at a time (lower peak memory); skip Next.js lint/typecheck in the image build.
RUN SKIP_BUILD_CHECKS=1 pnpm -r --workspace-concurrency=1 build

# API with production dependencies only, plus its generated Prisma client.
RUN pnpm --filter api --prod deploy /out/api \
    && cd /out/api \
    && node node_modules/prisma/build/index.js generate \
    && rm -rf src test

# Web with production dependencies only; drop the build cache and sources not needed by `next start`.
RUN pnpm --filter web --prod deploy /out/web \
    && cd /out/web \
    && rm -rf .next/cache __tests__ e2e test-results node_modules/.pnpm/@next+swc-*

# ---- runtime: only what is needed to run (fits RepoRun's disk quota) ----
FROM base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=build /out/api ./api
COPY --from=build /out/web ./web
COPY docker/start.cjs ./start.cjs

EXPOSE 3000

CMD ["node", "start.cjs"]
