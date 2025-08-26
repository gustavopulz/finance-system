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

# Copiar build standalone do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public || true
COPY --from=builder /app/package*.json ./

# Instalar apenas deps de produção (inclui next, react, etc.)
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "run", "start"]