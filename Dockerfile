# Multi-stage build for AI Test Case Generator
FROM node:18-alpine AS base

# Install Ollama
RUN apk add --no-cache curl
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Backend build stage
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
RUN cd backend && npm ci --production

# Copy frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV OLLAMA_HOST=http://localhost:11434
ENV OLLAMA_MODEL=qwen2.5-coder:7b

# Expose port
EXPOSE 3001

# Start Ollama and backend
WORKDIR /app/backend
CMD ["sh", "-c", "ollama serve & sleep 5 && ollama pull qwen2.5-coder:7b && node dist/server.js"]


