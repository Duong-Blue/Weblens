FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install

FROM base AS builder
RUN npm run build --prefix apps/api

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
