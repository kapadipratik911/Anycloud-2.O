# Render looks for ./Dockerfile at the repo root.
# This image builds and runs the Express API from /backend.
FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Build dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy source code
COPY backend/ ./

# Generate Prisma client so TypeScript has model types
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Set production environment
ENV NODE_ENV=production
EXPOSE 5000

# Run Prisma generate, migrations and start server at runtime
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]
