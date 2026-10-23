# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Install OpenSSL for Prisma and build tools for native addons (bcrypt)
RUN apt-get update -y && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests from backend
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and config from backend
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Remove build tools & dev dependencies
RUN npm prune --production

# Copy backend application source code
COPY backend/src ./src
COPY backend/uploads ./uploads
COPY backend/backfill-qr-tokens.js ./

# Expose backend port
EXPOSE 8080

# Start server
CMD ["npm", "start"]
