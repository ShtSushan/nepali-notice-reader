# ─────────────────────────────────────────
#   Upload Router
#   POST /upload
#   Receives image or PDF → runs full pipeline
#   OCR → Translate → Summarize → Embed → Save
# ─────────────────────────────────────────

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.services.gemini_service import extract_text_from_bytes, extract_text_from_pdf
from backend.services.groq_service   import translate_to_english, summarize_notice
from backend.services.embed_service  import process_text_for_storage
from backend.services.db_service     import (
    get_or_create_user,
    save_notice,
    save_chunks,
    update_active_notice
)

router = APIRouter()

# Allowed MIME types
IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp", "image/tiff"}
PDF_TYPES   = {"application/pdf"}


@router.post("/upload")
async def upload_notice(
    file:  UploadFile = File(...),
    email: str        = Form(...)
):
    """
    Accepts an image or PDF file + user email.
    Runs the full pipeline and returns summary.

    Steps:
    1. Get or create user
    2. Read file bytes + detect type
    3. OCR → raw Nepali text (image or PDF path)
    4. Translate → English
    5. Summarize → structured JSON
    6. Chunk + Embed
    7. Save everything to Supabase
    8. Return summary to frontend
    """
    try:
        # ── Step 1: get or create user ──
        user = get_or_create_user(email)

        # ── Step 2: read file bytes + detect type ──
        file_bytes = await file.read()
        mime_type  = file.content_type or ""

        # ── Step 3: OCR based on file type ──
        if mime_type in IMAGE_TYPES:
            nepali_text = extract_text_from_bytes(file_bytes)

        elif mime_type in PDF_TYPES:
            nepali_text = extract_text_from_pdf(file_bytes)

        else:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {mime_type}. Please upload an image (JPG, PNG) or a PDF."
            )

        # ── Step 4: translate ──
        english_text = translate_to_english(nepali_text)

        # ── Step 5: summarize ──
        summary = summarize_notice(english_text)

        # ── Step 6: chunk + embed ──
        chunks = process_text_for_storage(english_text)

        # ── Step 7: save to DB ──
        notice = save_notice(
            user_id         = user["id"],
            raw_nepali_text = nepali_text,
            translated_text = english_text,
            summary         = summary
        )
        save_chunks(notice["id"], chunks)
        update_active_notice(user["id"], notice["id"])

        # ── Step 8: return response ──
        return {
            "success":   True,
            "notice_id": notice["id"],
            "summary":   summary
        }

    except HTTPException:
        raise  # re-raise 415 as-is

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))