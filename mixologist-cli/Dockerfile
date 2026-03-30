# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps-prod
COPY package.json package-lock.json ./
COPY mixologist-cli/package.json ./mixologist-cli/package.json
COPY MCP_Server/package.json ./MCP_Server/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci -w mixologist-cli -w mcp-server --omit=dev

FROM base AS builder
COPY package.json package-lock.json ./
COPY mixologist-cli/package.json ./mixologist-cli/package.json
COPY MCP_Server/package.json ./MCP_Server/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci -w mixologist-cli -w mcp-server
COPY mixologist-cli ./mixologist-cli
COPY MCP_Server ./MCP_Server
RUN npm run build -w mcp-server && npm run build -w mixologist-cli

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps-prod /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY mixologist-cli/package.json ./mixologist-cli/package.json
COPY MCP_Server/package.json ./MCP_Server/package.json
COPY --from=builder /app/mixologist-cli/dist ./mixologist-cli/dist
COPY --from=builder /app/MCP_Server/dist ./MCP_Server/dist

ENV MCP_SERVER_PATH=/app/MCP_Server/dist/index.js
ENV MIXOLOGIST_HTTP_PORT=4100

USER nodejs
EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4100/health', (r) => { let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{const j=JSON.parse(b);process.exit(j.status==='ok'?0:1)}catch{process.exit(1)}});}).on('error',()=>process.exit(1));"

CMD ["node", "mixologist-cli/dist/server.js"]
