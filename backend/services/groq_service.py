# ─────────────────────────────────────────
#   Groq Service
#   Responsibility: Translation, Summarization, Q&A
#   Uses: Groq API (free) — llama-3.3-70b
# ─────────────────────────────────────────

import os
import json
from groq import Groq
from dotenv import load_dotenv
from backend.prompts.templates import (
    TRANSLATION_PROMPT,
    SUMMARY_PROMPT,
    QA_SYSTEM_PROMPT,
    QA_USER_PROMPT
)

load_dotenv()

# ── Configure Groq client once at module level ──
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL  = "llama-3.3-70b-versatile"


# ── 1. TRANSLATION ────────────────────────
def translate_to_english(nepali_text: str) -> str:
    """
    Takes raw Nepali text extracted by OCR.
    Returns full English translation as a string.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": TRANSLATION_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Translate this Nepali notice:\n\n{nepali_text}"
                }
            ]
        )

        translated = response.choices[0].message.content.strip()

        if not translated:
            raise ValueError("Groq returned empty translation")

        return translated

    except Exception as e:
        raise RuntimeError(f"Translation failed: {str(e)}")


# ── 2. SUMMARIZATION ──────────────────────
def summarize_notice(translated_text: str) -> dict:
    """
    Takes English translated text.
    Returns structured summary as a Python dict with keys:
    topic, who_affected, key_dates, action_required, office
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": SUMMARY_PROMPT.format(translated_text=translated_text)
                }
            ]
        )

        raw = response.choices[0].message.content.strip()

        # clean markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        summary = json.loads(raw)
        return summary

    except json.JSONDecodeError:
        # if JSON parsing fails return raw text in a safe dict
        return {
            "topic": raw,
            "who_affected": "N/A",
            "key_dates": [],
            "action_required": "N/A",
            "office": "N/A"
        }

    except Exception as e:
        raise RuntimeError(f"Summarization failed: {str(e)}")


# ── 3. Q&A ────────────────────────────────
def answer_question(
    user_question: str,
    context_chunks: list[str],
    chat_history: list[dict]
) -> str:
    """
    Takes user question, relevant notice chunks, and chat history.
    Returns answer as a string.

    context_chunks : list of relevant text chunks from pgvector search
    chat_history   : list of {"role": "user"/"assistant", "content": "..."}
    """
    try:
        # join chunks into single context string
        context = "\n\n---\n\n".join(context_chunks)

        # build messages list
        messages = [
            {
                "role": "system",
                "content": QA_SYSTEM_PROMPT.format(context=context)
            },
            # inject previous conversation history
            *chat_history,
            # current user question
            {
                 "role": "user",
                 "content": QA_USER_PROMPT.format(question=user_question)
            }
        ]

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages
        )

        answer = response.choices[0].message.content.strip()

        if not answer:
            raise ValueError("Groq returned empty answer")

        return answer

    except Exception as e:
        raise RuntimeError(f"Q&A failed: {str(e)}")