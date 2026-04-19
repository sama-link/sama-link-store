# syntax=docker/dockerfile:1
# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
# medusa build outputs a self-contained server to .medusa/server/
COPY --from=builder /app/.medusa/server ./
RUN npm install --omit=dev
EXPOSE 9000
# db:migrate is idempotent — safe to run on every cold start
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
