# Multi-stage build for Vite React application

ARG NODE_VERSION=24-alpine
# Stage 1: Build the application
FROM node:${NODE_VERSION} AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY ./app/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY ./app .

# Build the application
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:alpine-slim

# Set the working directory
WORKDIR /usr/share/nginx/html

# Copy built assets from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration (optional - for SPA routing)
COPY ./BuildTools/nginx/default_site.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
