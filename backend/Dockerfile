FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Create upload directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]

