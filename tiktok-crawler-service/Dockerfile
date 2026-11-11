FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Copy requirements & install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python Crawler application code
COPY . /app

# Ensure data and dataset directories exist
RUN mkdir -p /app/data /app/datasets

# Copy .env from host if present, fallback to .env.example
RUN if [ ! -f /app/.env ]; then \
        if [ -f /app/.env.example ]; then \
            cp /app/.env.example /app/.env; \
        fi; \
    fi

# Build-time overwrite of required Docker container fields in .env
RUN if [ -f /app/.env ]; then \
        sed -i 's|^CRAWLER_HOST=.*|CRAWLER_HOST=0.0.0.0|g' /app/.env || true; \
        sed -i 's|^CRAWLER_PORT=.*|CRAWLER_PORT=8001|g' /app/.env || true; \
        sed -i 's|^QUEUE_DB_PATH=.*|QUEUE_DB_PATH=data/queue.db|g' /app/.env || true; \
        sed -i 's|^LARAVEL_BASE_URL=.*|LARAVEL_BASE_URL=http://cms-app|g' /app/.env || true; \
        sed -i 's|^LARAVEL_API_URL=.*|LARAVEL_API_URL=http://cms-app/admin/api/public/crawler|g' /app/.env || true; \
        if grep -q "^BACKEND_CALLBACK_URL=" /app/.env; then \
            sed -i 's|^BACKEND_CALLBACK_URL=.*|BACKEND_CALLBACK_URL=http://cms-app/admin/api/public/crawler|g' /app/.env; \
        else \
            echo "BACKEND_CALLBACK_URL=http://cms-app/admin/api/public/crawler" >> /app/.env; \
        fi; \
    fi

EXPOSE 8001

CMD ["python", "app/main.py"]
