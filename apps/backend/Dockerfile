# syntax=docker/dockerfile:1
# ── Build stage ──────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
# medusa build outputs a self-contained server to .medusa/server/
COPY --from=builder /app/.medusa/server ./
# medusa build excludes src/scripts/ from the compiled output; bake it in
# so one-off tasks (seed, custom exec scripts) can run against this image.
COPY --from=builder /app/src/scripts ./src/scripts
# tsconfig.json is required by ts-node/swc to transpile TS scripts at runtime
# (activates { "ts-node": { "swc": true } } — type-check-free transpile).
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# Keep dev deps: medusa exec ./src/scripts/*.ts relies on TypeScript/ts-node
# at runtime to transpile raw TS. Stripping them breaks one-off exec scripts.
RUN npm install --no-audit --no-fund
EXPOSE 9000
# db:migrate is idempotent — safe to run on every cold start
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
