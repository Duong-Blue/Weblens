FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm ci

FROM base AS builder
RUN npm run build --workspaces --if-present

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Ensure browsers are installed
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
CMD ["node", "dist/apps/worker/src/main"]
