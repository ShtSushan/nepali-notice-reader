# ─────────────────────────────────────────
#   DB Service
#   Responsibility: All database operations
#   Uses: Supabase (PostgreSQL + pgvector)
# ─────────────────────────────────────────

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ── Initialize Supabase client once at module level ──
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


# ── 1. NOTICES ────────────────────────────

def save_notice(
    user_id: str,
    raw_nepali_text: str,
    translated_text: str,
    summary: dict,
    image_url: str = None
) -> dict:
    """
    Saves a new notice to the notices table.
    Returns the saved notice row including generated id.
    """
    response = supabase.table("notices").insert({
        "user_id":         user_id,
        "image_url":       image_url,
        "raw_nepali_text": raw_nepali_text,
        "translated_text": translated_text,
        "summary":         summary
    }).execute()

    return response.data[0]


def get_notice(notice_id: str) -> dict:
    """
    Fetches a single notice by its id.
    Returns the notice row as a dict.
    """
    response = supabase.table("notices")\
        .select("*")\
        .eq("id", notice_id)\
        .single()\
        .execute()

    return response.data


def get_all_notices(user_id: str) -> list[dict]:
    """
    Fetches all notices uploaded by a user.
    Returns list of notice rows ordered by latest first.
    """
    response = supabase.table("notices")\
        .select("id, summary, image_url, created_at")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()

    return response.data


# ── 2. NOTICE CHUNKS ─────────────────────

def save_chunks(notice_id: str, chunks: list[dict]) -> None:
    """
    Saves embedded chunks to notice_chunks table.
    chunks = [{"chunk_index": 0, "chunk_text": "...", "embedding": [...]}]
    """
    rows = [
        {
            "notice_id":   notice_id,
            "chunk_index": chunk["chunk_index"],
            "chunk_text":  chunk["chunk_text"],
            "embedding":   chunk["embedding"]
        }
        for chunk in chunks
    ]

    supabase.table("notice_chunks").insert(rows).execute()


def search_similar_chunks(
    notice_id: str,
    question_embedding: list[float],
    top_k: int = 3
) -> list[str]:
    """
    Searches notice_chunks for chunks most similar to the question.
    Uses pgvector cosine similarity via Supabase RPC.
    Returns list of top_k most relevant chunk texts.
    """
    response = supabase.rpc("match_chunks", {
        "query_embedding": question_embedding,
        "match_notice_id": notice_id,
        "match_count":     top_k
    }).execute()

    return [row["chunk_text"] for row in response.data]


# ── 3. CONVERSATIONS ─────────────────────

def save_message(notice_id: str, role: str, message: str) -> None:
    """
    Saves a single chat message to conversations table.
    role = 'user' or 'assistant'
    """
    supabase.table("conversations").insert({
        "notice_id": notice_id,
        "role":      role,
        "message":   message
    }).execute()


def get_chat_history(notice_id: str) -> list[dict]:
    """
    Fetches full conversation history for a notice.
    Returns list of {"role": ..., "content": ...} for LLM context.
    """
    response = supabase.table("conversations")\
        .select("role, message")\
        .eq("notice_id", notice_id)\
        .order("created_at", desc=False)\
        .execute()

    # format for Groq messages list
    return [
        {"role": row["role"], "content": row["message"]}
        for row in response.data
    ]

def clear_chat_history(notice_id: str) -> None:
    """
    Deletes all conversation messages for a notice.
    Called when user clicks Clear Chat.
    """
    supabase.table("conversations")\
        .delete()\
        .eq("notice_id", notice_id)\
        .execute()

# ── 4. USERS ─────────────────────────────

def get_or_create_user(email: str) -> dict:
    """
    Fetches existing user by email or creates a new one.
    Returns the user row as a dict.
    """
    # try to fetch existing user
    response = supabase.table("users")\
        .select("*")\
        .eq("email", email)\
        .execute()

    if response.data:
        return response.data[0]

    # create new user if not found
    response = supabase.table("users").insert({
        "email": email
    }).execute()

    return response.data[0]


def update_active_notice(user_id: str, notice_id: str) -> None:
    """
    Updates the active notice for a user.
    Called when user switches between uploaded notices.
    """
    supabase.table("users")\
        .update({"active_notice_id": notice_id})\
        .eq("id", user_id)\
        .execute()