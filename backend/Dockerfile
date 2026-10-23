# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Install OpenSSL for Prisma and build tools for native addons (bcrypt)
RUN apt-get update -y && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
# Placeholder for build time (real DATABASE_URL is injected by Fly.io at runtime via secrets)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/db"

# Copy package manifests
COPY package*.json ./

# Install dependencies (including prisma for generation)
RUN npm install

# Copy prisma schema and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Remove build tools & dev dependencies to optimize image size
RUN npm prune --production

# Copy application source code
COPY src ./src
COPY uploads ./uploads
COPY backfill-qr-tokens.js ./

# Expose backend port
EXPOSE 8080

# Start server
CMD ["npm", "start"]
