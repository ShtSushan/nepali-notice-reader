-- ─────────────────────────────────────────
--   Nepal Notice Reader — Database Schema
--   Run this in Supabase SQL Editor
-- ─────────────────────────────────────────

-- ── Users table ──
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            TEXT UNIQUE NOT NULL,
    active_notice_id UUID,
    created_at       TIMESTAMP DEFAULT now()
);

-- ── Notices table ──
CREATE TABLE notices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url        TEXT,
    raw_nepali_text  TEXT,
    translated_text  TEXT,
    summary          JSONB,
    created_at       TIMESTAMP DEFAULT now()
);

-- ── Notice chunks with vector embedding ──
CREATE TABLE notice_chunks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id    UUID REFERENCES notices(id) ON DELETE CASCADE,
    chunk_text   TEXT NOT NULL,
    chunk_index  INT,
    embedding    vector(768),
    created_at   TIMESTAMP DEFAULT now()
);

-- ── Conversations table (scoped per notice) ──
CREATE TABLE conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id  UUID REFERENCES notices(id) ON DELETE CASCADE,
    role       TEXT CHECK (role IN ('user', 'assistant')),
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- ── pgvector index for fast cosine similarity search ──
CREATE INDEX ON notice_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);