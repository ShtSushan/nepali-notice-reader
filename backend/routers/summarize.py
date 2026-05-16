# ─────────────────────────────────────────
#   Summarize Router
#   GET /summarize/{notice_id}
#   Returns summary + translated text
#   for an already uploaded notice
# ─────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from backend.services.db_service import get_notice

router = APIRouter()


@router.get("/summarize/{notice_id}")
def get_summary(notice_id: str):
    """
    Fetches summary for an already processed notice.
    Used when user switches between uploaded notices.
    """
    try:
        notice = get_notice(notice_id)

        if not notice:
            raise HTTPException(status_code=404, detail="Notice not found")

        return {
            "success":        True,
            "notice_id":      notice["id"],
            "summary":        notice["summary"],
            "translated_text": notice["translated_text"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))