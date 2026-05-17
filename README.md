---
title: Nepali Notice Reader
emoji: 🇳🇵
colorFrom: blue
colorTo: red
sdk: docker
pinned: false
---
# 🇳🇵 Nepali Notice Reader

An AI-powered web application that reads Nepali government notices, translates them into plain English, extracts key information, and lets users ask questions about the notice in a chat interface.

---

## 🎯 Problem it solves

Nepal government notices are written in complex, formal Nepali — difficult for the average person to understand. This app:

- Extracts text from notice images **and PDFs** using OCR
- Translates Nepali → English automatically
- Summarizes key info (topic, dates, deadlines, action required)
- Lets users ask natural language questions about the notice
- Maintains full chat history per notice per user
- Supports multiple notices with sidebar navigation

---

## 🏗️ Architecture

```
User uploads notice image or PDF
        │
        ▼
Tesseract OCR (local, free)
        │ extracts Nepali text
        │ (PDF → pages converted to images via pdf2image first)
        ▼
Groq API — Llama 3.3 70B (free)
        │ translates + summarizes
        ▼
sentence-transformers (local, free)
        │ chunks + embeds text
        ▼
Supabase PostgreSQL + pgvector (free)
        │ stores notice + embeddings + chat history
        ▼
User asks question
        │
        ▼
pgvector semantic search → top-3 relevant chunks
        │
        ▼
Groq API → structured markdown answer returned to user
```

---

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Free |
| Backend | FastAPI (Python) | Free |
| OCR | Tesseract (local) + pdf2image | Free |
| LLM | Groq API — Llama 3.3 70B | Free |
| Embeddings | sentence-transformers (local) | Free |
| Vector search | pgvector (PostgreSQL extension) | Free |
| Database | Supabase (PostgreSQL) | Free |
| Auth | Supabase Auth (email/password) | Free |

**Total cost: $0**

---

## 📁 Project Structure

```
nepali-notice-reader/
├── backend/
│   ├── prompts/
│   │   └── templates.py        # all LLM prompt strings
│   ├── routers/
│   │   ├── upload.py           # POST /upload (image + PDF)
│   │   ├── summarize.py        # GET /summarize/{notice_id}
│   │   ├── embed.py            # GET /embed/notices/{user_id}, GET /embed/user
│   │   └── chat.py             # POST /chat, GET /chat/history, DELETE /chat
│   ├── services/
│   │   ├── gemini_service.py   # OCR (Tesseract + pdf2image)
│   │   ├── groq_service.py     # translation + summarization + Q&A
│   │   ├── embed_service.py    # chunking + embeddings
│   │   └── db_service.py       # all Supabase queries
│   └── main.py                 # FastAPI entry point
├── frontend/
│   ├── lib/
│   │   └── supabase.ts         # Supabase client for auth
│   ├── components/
│   │   ├── UploadZone.tsx      # drag & drop upload (image + PDF)
│   │   ├── SummaryCard.tsx     # displays notice summary
│   │   ├── ChatBox.tsx         # Q&A chat with markdown rendering
│   │   └── NoticeSidebar.tsx   # notice history with 3-dot delete menu
│   └── app/
│       ├── page.tsx            # main app (auth-gated)
│       └── login/
│           └── page.tsx        # login + signup page
├── db/
│   └── schema.sql              # PostgreSQL + pgvector schema
├── research/
│   └── trials.ipynb            # pipeline testing notebook
├── .env                        # API keys (never commit)
├── requirements.txt            # Python dependencies
└── README.md
```

---

## ⚙️ Prerequisites

### System requirements
- Python 3.11+
- Node.js 18+
- Tesseract OCR 5.x with Nepali language pack
- Poppler (for PDF support on Windows)

### Install Tesseract (Windows)
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. During install, check **"Additional language data → Nepali"**
3. Add `C:\Program Files\Tesseract-OCR` to Windows PATH

### Install Tesseract (Linux/Railway)
```bash
apt-get install -y tesseract-ocr tesseract-ocr-nep
```

### Install Poppler (Windows — required for PDF support)
1. Download from: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract to `C:\poppler\`
3. Update `POPPLER_PATH` in `backend/services/gemini_service.py` to match your path

### Install Poppler (Linux/Railway)
```bash
apt-get install -y poppler-utils
```

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/ShtSushan/nepali-notice-reader.git
cd nepali-notice-reader
```

### 2. Create and activate virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

Get free API keys from:
- Groq → https://console.groq.com
- Supabase → https://supabase.com

### 5. Set up frontend environment variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 6. Set up Supabase database
1. Create a new project at https://supabase.com
2. Go to **SQL Editor**
3. Run `CREATE EXTENSION IF NOT EXISTS vector;`
4. Run the full contents of `db/schema.sql`
5. Run the pgvector search function:

```sql
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(768),
    match_notice_id UUID,
    match_count INT
)
RETURNS TABLE (chunk_text TEXT, similarity FLOAT)
LANGUAGE SQL STABLE
AS $$
    SELECT
        chunk_text,
        1 - (embedding <=> query_embedding) AS similarity
    FROM notice_chunks
    WHERE notice_id = match_notice_id
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

6. Disable RLS for development (re-enable with policies for production):
```sql
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE notices        DISABLE ROW LEVEL SECURITY;
ALTER TABLE notice_chunks  DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  DISABLE ROW LEVEL SECURITY;
```

7. Enable Email auth in Supabase → Authentication → Providers → Email

### 7. Run the backend
```bash
uvicorn backend.main:app --reload
```

API running at: `http://127.0.0.1:8000`
Swagger docs at: `http://127.0.0.1:8000/docs`

### 8. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend running at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/upload` | Upload notice image or PDF → returns summary |
| GET | `/summarize/{notice_id}` | Get summary for existing notice |
| GET | `/embed/user?email=` | Get or create user by email |
| GET | `/embed/notices/{user_id}` | Get all notices for a user |
| PATCH | `/embed/switch/{user_id}/{notice_id}` | Switch active notice |
| DELETE | `/notices/{notice_id}` | Delete notice + chunks + chat history |
| POST | `/chat` | Ask a question about a notice |
| GET | `/chat/history/{notice_id}` | Get full chat history for a notice |
| DELETE | `/chat/{notice_id}` | Clear chat history for a notice |

---

## 🗄️ Database Schema

```sql
users          — stores user accounts (email, active_notice_id)
notices        — stores uploaded notices + translations + summaries (JSONB)
notice_chunks  — stores text chunks + 768-dim embeddings (pgvector)
conversations  — stores chat history per notice (role + message)
```

---

## ✅ Features

- **Image + PDF upload** — drag & drop or click to upload
- **Nepali OCR** — Tesseract with nep+eng language support
- **Auto translation** — Nepali → English via Groq Llama 3.3 70B
- **Structured summary** — topic, who affected, key dates, action required, office
- **Semantic Q&A** — pgvector cosine search + Groq for accurate answers
- **Markdown responses** — bold, numbered lists, bullet points rendered in chat
- **Chat history** — persisted in Supabase, restored on page load
- **Clear chat** — reset conversation per notice
- **Notice sidebar** — browse all uploaded notices with 3-dot delete menu
- **User auth** — email/password via Supabase Auth, per-user data isolation
- **Session restore** — all notices and last active notice restored on refresh

---

## 🚢 Deployment

### Backend (Railway)
1. Push code to GitHub
2. Create new project at https://railway.app
3. Connect your GitHub repo
4. Add all `.env` variables in Railway dashboard
5. Add `nixpacks.toml` for Tesseract + Poppler:
```toml
[phases.setup]
nixPkgs = ["tesseract", "tesseract-data-nep", "poppler-utils"]
```
6. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
7. Update `POPPLER_PATH` in `gemini_service.py` to `None` for Linux (pdf2image finds it automatically)

### Frontend (Vercel)
1. Push `frontend/` to GitHub
2. Import project at https://vercel.com
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables
4. Replace all `http://127.0.0.1:8000` with your Railway backend URL
5. Deploy

---

## 🔮 Future improvements

- Google OAuth login
- Search across multiple notices (multi-doc semantic search)
- Email notifications for deadlines
- Nepali language output option
- Mobile responsive improvements
- Loading skeleton UI
- Re-enable Supabase RLS with proper policies for production

---

## 👨‍💻 Author

Built by ShtSushan — May 2026