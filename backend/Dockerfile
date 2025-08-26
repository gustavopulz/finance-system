# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: produção
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copiar build standalone completo (inclui node_modules e server.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Se não tiver public, tudo bem, removemos
# COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Rodar pelo server.js gerado pelo Next standalone
CMD ["node", "server.js"]
