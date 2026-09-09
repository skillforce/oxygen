# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# `fetch` resolves from the lockfile by definition; the flag only existed to
# say so, and pnpm 12 rejects it outright.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch

FROM deps AS build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

COPY . .

RUN --mount=type=cache,id=astro-assets,target=/app/node_modules/.astro \
    pnpm build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
