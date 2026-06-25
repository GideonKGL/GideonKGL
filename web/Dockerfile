FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/package.json
COPY web/package.json ./web/package.json
COPY desktop/package.json ./desktop/package.json
RUN npm ci -w @guardian/web

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @guardian/web

FROM nginx:1.27-alpine
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
