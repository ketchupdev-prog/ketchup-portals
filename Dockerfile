# -----------------------------------------------------------------------------
# Ketchup Portals – Production Dockerfile (Next.js standalone output)
# Multi-stage: deps → build → runtime. Requires next.config output: "standalone".
# Build: pass DATABASE_URL (and optional BUFFR_API_URL, NEXT_PUBLIC_PORTAL_URL) if needed at build time.
# Run: pass real env via --env-file .env or -e (DATABASE_URL, Neon Auth, SMTP, etc.).
# -----------------------------------------------------------------------------

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder (dummy env if not provided so build succeeds in CI)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Optional build-time env (override with --build-arg in production)
ARG DATABASE_URL=postgresql://local:local@localhost:5432/build?sslmode=require
ARG BUFFR_API_URL=https://api.ketchup.cc
ARG NEXT_PUBLIC_PORTAL_URL=https://portal.ketchup.cc
ENV DATABASE_URL=$DATABASE_URL
ENV BUFFR_API_URL=$BUFFR_API_URL
ENV NEXT_PUBLIC_PORTAL_URL=$NEXT_PUBLIC_PORTAL_URL
ENV NEXT_PUBLIC_NEON_AUTH_URL=
ENV NEON_AUTH_BASE_URL=
ENV NEON_AUTH_COOKIE_SECRET=build-time-dummy-secret-min-32-chars
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
