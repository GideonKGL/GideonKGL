FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/package.json
COPY web/package.json ./web/package.json
COPY desktop/package.json ./desktop/package.json
RUN npm ci -w @guardian/backend

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate -w @guardian/backend && npm run build -w @guardian/backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY package*.json ./
COPY backend/package.json ./backend/package.json
EXPOSE 4000
CMD ["sh", "-c", "npm run migrate -w @guardian/backend && node backend/dist/server.js"]
