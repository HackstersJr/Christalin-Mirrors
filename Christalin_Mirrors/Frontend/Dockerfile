# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build for production
RUN npm run build

# Serve stage
FROM nginx:stable-alpine

# Copy built assets to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
