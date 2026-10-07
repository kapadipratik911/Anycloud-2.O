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

# Build TypeScript (skip Prisma generate at build time)
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Set production environment
ENV NODE_ENV=production
EXPOSE 5000

# Run Prisma generate, sync schema and start server at runtime
# DATABASE_URL must be set as environment variable in Render
# Use Supabase connection pooling URL for cloud deployments
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --skip-generate && node dist/server.js"]

