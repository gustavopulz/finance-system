# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar o restante do código
COPY . .

# Build do Next.js
RUN npm run build

# Etapa 2: produção
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copiar build standalone do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Expor a porta usada pelo Next
EXPOSE 3000

# Rodar Next.js em produção
CMD ["npm", "run", "start"]