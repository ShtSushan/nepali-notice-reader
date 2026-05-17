# ─────────────────────────────────────────
#   Main FastAPI Application
#   Entry point for the backend
#   Run: uvicorn backend.main:app --reload
# ─────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import upload, summarize, embed, chat

# ── Initialize FastAPI app ──
app = FastAPI(
    title       = "Nepali Notice Reader API",
    description = "Upload Nepali government notices and chat with them in English",
    version     = "1.0.0"
)

# ── CORS — allow frontend to talk to backend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "http://localhost:3000",        # local development
        "https://*.vercel.app",         # covers all Vercel deployments
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Register all routers ──
app.include_router(upload.router,    tags=["Upload"])
app.include_router(summarize.router, tags=["Summarize"])
app.include_router(embed.router,     tags=["Notices"])
app.include_router(chat.router,      tags=["Chat"])


# ── Health check ──
@app.get("/")
def root():
    return {
        "status":  "Nepali Notice Reader API is running",
        "version": "1.0.0",
        "docs":    "/docs"
    }