FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Backend deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY main.py config.py database.py models.py utils.py schemas.sql team.py ./

# Copy frontend build
COPY frontend/dist ./frontend/dist
COPY frontend/public ./frontend/public

# Expose port
EXPOSE 8001

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
