---
title: Auto Clipper
emoji: 🎬
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# Auto Clipper (Mobile Web + HF Spaces)

Auto Clipper turns long videos into vertical Shorts-ready clips. It is designed to run as a **mobile web app** (open from your phone browser) with **cloud AI processing** so your phone does not need heavy local models.

## What it does

- **Mobile responsive interface** for Android/iPhone browsers.
- **YouTube URL input**.
- **Video upload option** (MP4/MOV/MKV/WebM/M4V).
- **AI viral clip detection** (Groq LLM).
- **Automatic 9:16 Shorts** rendering (1080x1920 MP4).
- **Animated stylish subtitles** (ASS: hook animation, per-word highlight, emoji pops).
- **Face tracking** for 9:16 crop (dynamic smoothed trajectory, OpenCV-based).
- **MP4 download** for each generated clip.
- **Cloud processing** via Groq APIs (no heavy local Whisper/LLM required on default deploy).
- **Hugging Face Spaces Docker** deployable.

## How it works

1. **Input**: YouTube URL or uploaded video file.
2. **Transcription**: Groq Whisper API (`TRANSCRIBER_PROVIDER=groq`, default).
3. **Viral clip selection**: Groq LLM analyzes transcript and picks hook/caption/hashtags/score.
4. **Render**: ffmpeg creates 9:16 MP4 with animated subtitles and face-tracking crop.
5. **Output**: preview and download clips from the web UI.

## Deploy on Render (free)

This repo includes `render.yaml` for Render Blueprint deploy.

1. Push this repo to GitHub (or upload the ZIP contents to a GitHub repo).
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint** (or **Web Service** → **Public Git Repository**).
4. Connect the repo. Render will detect `render.yaml` / `Dockerfile`.
5. Set environment variable:
   - `GROQ_API_KEY` = your Groq API key (required)
6. Deploy. When live, open the Render URL on your phone.

### Render free-tier notes

- **Free Docker web service**: may spin down after inactivity; first request after sleep can take ~30-60s.
- **Ephemeral disk**: generated files/DB may be lost on restart/redeploy. Download clips after generation.
- **Upload size**: default `MAX_UPLOAD_MB=100` for free tier; increase on paid plans.
- **Processing**: ffmpeg runs on server; AI uses Groq cloud APIs. Your phone only needs a browser.

## Deploy on Hugging Face Spaces (Docker, if available)

1. Create a new Space: **SDK = Docker**.
2. Upload/push this repository to the Space.
3. In **Space Settings → Variables and secrets**, add `GROQ_API_KEY`.
4. Wait for build and open the Space URL.

## Local run (optional)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp config/.env.example config/.env
# edit config/.env and set GROQ_API_KEY
uvicorn dashboard.app:app --host 0.0.0.0 --port 7860
```

Open `http://localhost:7860`.

## Environment variables

| Key | Default | Description |
|---|---:|---|
| `GROQ_API_KEY` | empty | Required for Groq LLM + Groq Whisper transcription |
| `LLM_PROVIDER` | `groq` | `groq`, `openrouter`, or `ollama` |
| `TRANSCRIBER_PROVIDER` | `groq` | `groq` (cloud) or `local` (requires faster-whisper) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Clip analysis model |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3-turbo` | Cloud transcription model |
| `MAX_UPLOAD_MB` | `100` (Render default) | Upload size limit |
| `FACE_TRACKING_MODE` | `dynamic` | `dynamic`, `static`, or `center` |
| `CLIP_MIN_SEC` / `CLIP_MAX_SEC` | `30` / `60` | Clip duration bounds |
| `CLIP_COUNT_MIN` / `CLIP_COUNT_MAX` | `3` / `7` | Clip count bounds |

## API endpoints

- `GET /` - mobile web UI
- `POST /submit` - queue YouTube/video URL
- `POST /upload` - upload video file and queue processing
- `POST /regenerate/{video_id}` - rerun analysis/render for existing source
- `GET /api/status` - queue/status/config summary
- `GET /health` - health check

## Limitations / honesty

- YouTube downloads may fail on some cloud IPs due YouTube restrictions; upload is the reliable fallback.
- Face tracking is OpenCV-based (lightweight) and works best when a face is visible; it falls back to center crop when detection is weak.
- This environment cannot fully validate live Groq/HF end-to-end without your API keys and deployed runtime.
