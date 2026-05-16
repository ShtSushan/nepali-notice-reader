# ─────────────────────────────────────────
#   Embed Service
#   Responsibility: Chunking + Embeddings
#   Uses: sentence-transformers (local, free)
#   Model: paraphrase-multilingual-mpnet-base-v2
#   Supports: Nepali + English
# ─────────────────────────────────────────

from sentence_transformers import SentenceTransformer

# ── Load model once at module level ──
# downloads ~420MB on first run, cached after that
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
model = SentenceTransformer(MODEL_NAME)


# ── 1. CHUNKING ───────────────────────────
def split_into_chunks(
    text: str,
    chunk_size: int = 300,
    overlap: int = 50
) -> list[str]:
    """
    Splits text into overlapping word chunks.

    chunk_size : number of words per chunk
    overlap    : number of words shared between consecutive chunks
                 ensures context is not lost at chunk boundaries

    Example with chunk_size=5, overlap=2:
    "a b c d e f g h" →
    ["a b c d e", "d e f g h"]
    """
    words  = text.split()
    chunks = []
    start  = 0

    while start < len(words):
        end   = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


# ── 2. EMBEDDING ──────────────────────────
def embed_text(text: str) -> list[float]:
    """
    Takes a single string.
    Returns a 768-dimensional vector as a list of floats.
    Used for embedding a user question before similarity search.
    """
    vector = model.encode(text)
    return vector.tolist()


def embed_chunks(chunks: list[str]) -> list[dict]:
    """
    Takes a list of text chunks.
    Returns a list of dicts with chunk_text and embedding.

    Output format:
    [
        {"chunk_index": 0, "chunk_text": "...", "embedding": [0.12, ...]},
        {"chunk_index": 1, "chunk_text": "...", "embedding": [0.87, ...]},
        ...
    ]
    """
    results = []

    for index, chunk in enumerate(chunks):
        vector = model.encode(chunk).tolist()
        results.append({
            "chunk_index": index,
            "chunk_text":  chunk,
            "embedding":   vector
        })

    return results


# ── 3. FULL PIPELINE ─────────────────────
def process_text_for_storage(translated_text: str) -> list[dict]:
    """
    Full pipeline: translated text → chunks → embeddings.
    This is the main function called by the router.

    Returns list of dicts ready to insert into notice_chunks table.
    """
    chunks          = split_into_chunks(translated_text)
    embedded_chunks = embed_chunks(chunks)
    return embedded_chunks