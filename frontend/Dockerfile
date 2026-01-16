FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN corepack enable && pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app ./

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
