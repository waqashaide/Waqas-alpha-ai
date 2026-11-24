FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Works on Hugging Face Spaces and Render (free Docker web service).
# Render free instances have ephemeral disk; /tmp is always writable.
ENV OUTPUT_DIR=/tmp/output \
    DB_PATH=/tmp/auto_clipper.db \
    HF_HOME=/tmp/.cache/huggingface \
    XDG_CACHE_HOME=/tmp/.cache \
    LLM_PROVIDER=groq \
    TRANSCRIBER_PROVIDER=groq \
    GROQ_WHISPER_MODEL=whisper-large-v3-turbo \
    GROQ_MODEL=llama-3.3-70b-versatile \
    WHISPER_MODEL=small \
    WHISPER_DEVICE=cpu \
    WHISPER_COMPUTE=int8 \
    FACE_TRACKING_MODE=dynamic \
    MAX_UPLOAD_MB=100 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN mkdir -p /tmp/output /data && chmod -R 777 /tmp/output /data || true

EXPOSE 7860

CMD ["sh", "-c", "mkdir -p ${OUTPUT_DIR:-/tmp/output} ${HF_HOME:-/tmp/.cache/huggingface} && exec uvicorn dashboard.app:app --host 0.0.0.0 --port ${PORT:-7860}"]
