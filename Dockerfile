# Stage 1: Build
FROM node:22.18.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build --base /

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

LABEL org.opencontainers.image.title="dat-reader-web"
LABEL org.opencontainers.image.description="Browser-based viewer for Xray-core GeoIP/GeoSite .dat files"
LABEL org.opencontainers.image.source="https://github.com/aspect-build/dat-reader-web"
