# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

# Copy necessary files
COPY package.json ./
COPY --from=builder /app/build ./build

# Install production dependencies
RUN npm install --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001 && \
    chown -R sveltekit:nodejs /app

USER sveltekit

EXPOSE 5173

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

CMD ["node", "build"]