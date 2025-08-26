# Etapa 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia apenas a pasta backend
COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

# Etapa 2: produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia build standalone do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]