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

# Ensure .env exists (fallback to .env.example if not present)
RUN cp -n .env.example .env 2>/dev/null || true

EXPOSE 8001

CMD ["python", "app/main.py"]
