# Render looks for ./Dockerfile at the repo root.
# This image builds and runs the Express API from /backend.
FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
