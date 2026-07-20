FROM mcr.microsoft.com/playwright:v1.45.0-jammy AS base
WORKDIR /app
COPY . .
RUN npm install

FROM base AS builder
RUN npm run build --prefix apps/worker

FROM mcr.microsoft.com/playwright:v1.45.0-jammy AS runner
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure browsers are installed
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
CMD ["node", "apps/worker/dist/main"]
