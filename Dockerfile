# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

# Copy frontend source files
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Build production bundle (outputs to /build/dist)
RUN npm run build

# ==========================================
# Stage 2: Create the python production app
# ==========================================
FROM python:3.11-slim AS backend-runner
WORKDIR /app

# Install system dependencies needed for compiling python packages (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy backend codebase
COPY main.py ./
COPY app/ ./app/

# Copy built frontend assets from Stage 1 into the 'static' directory
COPY --from=frontend-builder /build/dist ./static

EXPOSE 8000
ENV PORT=8000
ENV DATABASE_URL=sqlite:///./urls.db

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips '*'"]

