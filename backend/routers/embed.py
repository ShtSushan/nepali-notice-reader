# ─────────────────────────────────────────
#   Embed Router
#   GET /embed/notices/{user_id}
#   Returns all notices for a user
#   Used to populate the sidebar
# ─────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from backend.services.db_service import get_all_notices, update_active_notice

router = APIRouter()


@router.get("/embed/notices/{user_id}")
def get_notices(user_id: str):
    """
    Returns all notices uploaded by a user.
    Used to populate the notice sidebar on frontend.
    """
    try:
        notices = get_all_notices(user_id)
        return {
            "success": True,
            "notices": notices
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/embed/switch/{user_id}/{notice_id}")
def switch_notice(user_id: str, notice_id: str):
    """
    Switches the active notice for a user.
    Called when user clicks a different notice in sidebar.
    """
    try:
        update_active_notice(user_id, notice_id)
        return {
            "success":   True,
            "notice_id": notice_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))