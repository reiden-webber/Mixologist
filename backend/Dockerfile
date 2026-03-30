# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY MCP_Server/package.json ./MCP_Server/package.json
COPY mixologist-cli/package.json ./mixologist-cli/package.json
RUN npm ci -w backend
COPY backend ./backend
RUN npm run build -w backend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/backend/dist ./backend/dist

USER nodejs
EXPOSE 4000
ENV PORT=4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health', (r) => { let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{const j=JSON.parse(b);process.exit(j.status==='ok'?0:1)}catch{process.exit(1)}});}).on('error',()=>process.exit(1));"

CMD ["node", "backend/dist/index.js"]
