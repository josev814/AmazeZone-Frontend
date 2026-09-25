# Development build for Vite React application (dev server)
ARG NODE_VERSION=24-alpine
FROM node:${NODE_VERSION}

# Set working directory
WORKDIR /app

# Copy package files
COPY ./app/package*.json ./

# Clean Install dependencies
RUN npm install

# Port the dev server listens on.
# Build-time default for EXPOSE; at runtime the container env var VITE_PORT
# (e.g. from app/.env.dev) takes precedence in the CMD below.
ARG VITE_PORT=3000
EXPOSE ${VITE_PORT}

# Use the shell form so ${VITE_PORT:-3000} is expanded by sh at startup.
# In exec (JSON) form the literal string "${VITE_PORT}" would be passed to
# vite, which cannot parse it as a port.
CMD npm run dev -- --host 0.0.0.0 --port "${VITE_PORT:-3000}"
