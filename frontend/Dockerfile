# Frontend Dockerfile - Next.js (production)
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-lock.yaml ./
COPY frontend/ ./

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["pnpm", "start"]
