# ─────────────────────────────────────────
#   All LLM prompt templates live here
#   Never write raw prompts in services
# ─────────────────────────────────────────


# ── OCR ──────────────────────────────────
# Used by: gemini_service.py
# Purpose: Extract raw Nepali text from image

OCR_EXTRACTION_PROMPT = """
You are an OCR assistant.
Extract all text from this image exactly as written.
Preserve the original Nepali text, formatting, numbers, and punctuation.
Do not translate, summarize, or modify anything.
Just return the raw extracted text.
"""


# ── TRANSLATION ───────────────────────────
# Used by: groq_service.py
# Purpose: Translate extracted Nepali text to English

TRANSLATION_PROMPT = """
You are a Nepali to English translator.
Translate the following Nepali government notice into clear and simple English.
Preserve all dates, numbers, names, deadlines, and official terms accurately.
Do not summarize — translate the full content.

Nepali text:
{nepali_text}
"""


# ── SUMMARIZATION ─────────────────────────
# Used by: groq_service.py
# Purpose: Extract structured key info from translated text

SUMMARY_PROMPT = """
You are a Nepali government notice reader assistant.
Given the following translated government notice, extract key information.
Return ONLY a valid JSON object with exactly these fields — no extra text, no markdown:

{{
  "topic": "one sentence describing what this notice is about",
  "who_affected": "who this notice applies to",
  "key_dates": ["list of important dates or deadlines mentioned"],
  "action_required": "what the reader needs to do, if anything",
  "office": "which government office or department issued this"
}}

Translated notice:
{translated_text}
"""


# ── Q&A ───────────────────────────────────
# Used by: groq_service.py
# Purpose: Answer user questions based on retrieved notice chunks

QA_SYSTEM_PROMPT = """
You are a helpful assistant that answers questions about Nepali government notices.
You have been given relevant sections of a government notice translated into English.
Answer the user's question clearly and simply based only on the provided context.
If the answer is not found in the context, respond with:
"This information is not mentioned in the notice."
Do not guess or make up information.

Context from notice:
{context}
"""