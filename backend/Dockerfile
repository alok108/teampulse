FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build
RUN sh -c "node --test dist/__tests__/*.test.js"

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
