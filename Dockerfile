FROM python:3.11-slim

# Install Tesseract + Nepali language pack + Poppler
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-nep \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code only
COPY backend/ ./backend/

# Expose Hugging Face default port
EXPOSE 7860

# Start FastAPI
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]