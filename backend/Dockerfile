# Base image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy app files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node src/server/index.js"]