# syntax=docker/dockerfile:1
# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_LOCALE=ar
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY
ARG NEXT_PUBLIC_MEDUSA_REGION_ID

ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY
ENV NEXT_PUBLIC_MEDUSA_REGION_ID=$NEXT_PUBLIC_MEDUSA_REGION_ID

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Cloud Run injects PORT; Next.js standalone server.js reads it automatically
EXPOSE 3000
CMD ["node", "server.js"]
