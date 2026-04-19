# ─────────────────────────────────────────────
# Stage 1: Builder
# Install all monorepo dependencies and build
# the backend workspace.
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build-time OS deps (python/make/g++ for native addons)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first so dependency layers are cached independently
# of source changes.
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

# Reproducible install of ALL workspace dependencies
RUN npm ci

# Copy the full source tree (respects .dockerignore at repo root)
COPY . .

# Build only the backend workspace; Medusa outputs to
# apps/backend/.medusa/server
RUN npm run build --workspace=apps/backend

# ─────────────────────────────────────────────
# Stage 2: Runtime
# Lean production image — only what Medusa needs
# to run.
# ─────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy the compiled server bundle produced by `medusa build`
COPY --from=builder /app/apps/backend/.medusa/server ./

# Install production dependencies declared by the compiled bundle.
# `medusa build` writes its own package.json into .medusa/server.
RUN npm ci --omit=dev

# Medusa config and any static assets that live alongside the server
COPY --from=builder /app/apps/backend/medusa-config.ts ./

EXPOSE 9000

# Run database migrations then start the server
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
