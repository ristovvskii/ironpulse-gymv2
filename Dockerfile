FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
