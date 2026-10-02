# WazehTerms application image (docs/DEPLOYMENT.md §2, ADR-008):
# one process serves the built React assets, the Express API under /api/v1,
# /health, and the six allowlisted sample fixtures. No .env, corpus truth,
# sources, docs, plans, or Sanity Studio enter the image (.dockerignore
# enforces this; the policy check in plans/phase-14 verifies it).

# --- build: full toolchain (dev deps included) for both workspaces ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci
COPY api/ api/
COPY web/ web/
RUN npm run build --workspace api && npm run build --workspace web

# --- runtime-deps: production dependencies of the api workspace only ---
FROM node:22-bookworm-slim AS runtime-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY api/package.json api/
RUN npm ci --omit=dev --workspace api && npm cache clean --force

# --- runtime: non-root, Cloud Run PORT contract ---
FROM node:22-bookworm-slim AS runtime
WORKDIR /app/api
ENV NODE_ENV=production
# Cloud Run injects PORT; 8080 is only the local fallback.
ENV PORT=8080
COPY --from=runtime-deps /app/node_modules /app/node_modules
COPY --from=runtime-deps /app/api/node_modules /app/api/node_modules
COPY api/package.json ./
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/web/dist /app/web/dist
COPY fixtures/samples /app/fixtures/samples
USER node
EXPOSE 8080
CMD ["node", "dist/server/index.js"]
