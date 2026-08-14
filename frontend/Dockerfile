# Multi-stage Dockerfile for React + Vite Frontend
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for single-page app routing & API proxying
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /review { \
        proxy_pass http://backend:8000; \
    } \
    location /reviews { \
        proxy_pass http://backend:8000; \
    } \
    location /github { \
        proxy_pass http://backend:8000; \
    } \
    location /health { \
        proxy_pass http://backend:8000; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
