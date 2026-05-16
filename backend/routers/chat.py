# ─────────────────────────────────────────
#   Chat Router
#   POST /chat
#   Accepts user question + notice_id
#   Returns answer from Groq
# ─────────────────────────────────────────

from fastapi  import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.groq_service  import answer_question
from backend.services.embed_service import embed_text
from backend.services.db_service    import (
    search_similar_chunks,
    get_chat_history,
    save_message,
    clear_chat_history 
)

router = APIRouter()


# ── Request body schema ──
class ChatRequest(BaseModel):
    notice_id: str
    question:  str


@router.post("/chat")
def chat_with_notice(request: ChatRequest):
    """
    Accepts a question and notice_id.
    Returns an answer based on the notice content.

    Steps:
    1. Embed the user question
    2. Search for relevant chunks via pgvector
    3. Load chat history from DB
    4. Send to Groq for answer
    5. Save Q&A to conversations table
    6. Return answer to frontend
    """
    try:
        # ── Step 1: embed question ──
        question_vector = embed_text(request.question)

        # ── Step 2: semantic search ──
        chunks = search_similar_chunks(
            notice_id          = request.notice_id,
            question_embedding = question_vector,
            top_k              = 3
        )

        if not chunks:
            return {
                "success": True,
                "answer":  "No relevant information found in this notice."
            }

        # ── Step 3: load chat history ──
        history = get_chat_history(request.notice_id)

        # ── Step 4: get answer from Groq ──
        answer = answer_question(
            user_question  = request.question,
            context_chunks = chunks,
            chat_history   = history
        )

        # ── Step 5: save to DB ──
        save_message(request.notice_id, "user",      request.question)
        save_message(request.notice_id, "assistant", answer)

        # ── Step 6: return response ──
        return {
            "success": True,
            "answer":  answer
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/chat/{notice_id}")
def clear_chat(notice_id: str):
    """
    Deletes all conversation history for a notice.
    Called when user clicks Clear Chat in frontend.
    """
    try:
        clear_chat_history(notice_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/chat/history/{notice_id}")
def get_history(notice_id: str):
    """
    Returns full chat history for a notice.
    Called on page load and when switching notices.
    """
    try:
        history = get_chat_history(notice_id)
        return {
            "success": True,
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))