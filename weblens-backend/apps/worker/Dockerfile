FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm ci

FROM base AS builder
RUN npm run build --prefix packages/audit-engine && npm run build --prefix packages/tech-detector && npm run build --prefix packages/shared-types && npm run build --prefix apps/worker

FROM mcr.microsoft.com/playwright:v1.62.0-jammy AS runner
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages




CMD ["node", "dist/apps/worker/src/main"]