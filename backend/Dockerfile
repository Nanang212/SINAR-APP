# Base image
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g pm2

COPY . .

# Generate Prisma Client (boleh di build time)
RUN npm run db:generate

# Sisanya nanti dijalankan saat container run
CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm run start:pm2"]
