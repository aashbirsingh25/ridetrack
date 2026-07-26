# ==========================================
# Multi-stage Dockerfile for eta-prediction-service
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create virtual environment for isolated dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy dependencies list and install into virtualenv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3004
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for security best practices
RUN useradd -m -u 1000 appuser

# Copy virtualenv and application code with trained model from builder stage
COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appuser . /app

USER appuser

EXPOSE 3004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]
