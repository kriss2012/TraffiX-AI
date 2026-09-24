# ==============================================================================
# TraffiX-AI: Production Dockerfile
# Smart India Hackathon (SIH26127) Municipal Command Center & Inference Engine
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TRAFFIX_HOST=0.0.0.0 \
    TRAFFIX_PORT=8000

WORKDIR /app

# Install security updates and curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend source directories
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Create a non-privileged system user for secure execution
RUN useradd -u 10001 -m traffix && \
    chown -R traffix:traffix /app

USER traffix

# Expose ICCC Command Center Gateway Port
EXPOSE 8000

# Automated healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/system/health || exit 1

# Launch TraffiX-AI Engine
CMD ["python", "backend/main.py"]
