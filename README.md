# 🇳🇵 Nepali Notice Reader

An AI-powered web application that reads Nepali government notices, translates them into plain English, extracts key information, and lets users ask questions about the notice in a chat interface.

---

## 🎯 Problem it solves

Nepal government notices are written in complex, formal Nepali — difficult for the average person to understand. This app:

- Extracts text from notice images using OCR
- Translates Nepali → English automatically
- Summarizes key info (topic, dates, deadlines, action required)
- Lets users ask natural language questions about the notice

---

## 🏗️ Architecture

```
User uploads notice image
        │
        ▼
Tesseract OCR (local, free)
        │ extracts Nepali text
        ▼
Groq API — Llama 3.3 70B (free)
        │ translates + summarizes
        ▼
sentence-transformers (local, free)
        │ chunks + embeds text
        ▼
Supabase PostgreSQL + pgvector (free)
        │ stores notice + embeddings
        ▼
User asks question
        │
        ▼
pgvector semantic search → top-3 relevant chunks
        │
        ▼
Groq API → answer returned to user
```

---

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Free |
| Backend | FastAPI (Python) | Free |
| OCR | Tesseract (local) | Free |
| LLM | Groq API — Llama 3.3 70B | Free |
| Embeddings | sentence-transformers (local) | Free |
| Vector search | pgvector (PostgreSQL extension) | Free |
| Database | Supabase (PostgreSQL) | Free |
| File storage | Cloudinary (optional) | Free tier |

**Total cost: $0**

---

## 📁 Project Structure

```
nepali-notice-reader/
├── backend/
│   ├── prompts/
│   │   └── templates.py        # all LLM prompt strings
│   ├── routers/
│   │   ├── upload.py           # POST /upload
│   │   ├── summarize.py        # GET /summarize/{notice_id}
│   │   ├── embed.py            # GET /embed/notices/{user_id}
│   │   └── chat.py             # POST /chat
│   ├── services/
│   │   ├── gemini_service.py   # OCR (Tesseract)
│   │   ├── groq_service.py     # translation + summarization + Q&A
│   │   ├── embed_service.py    # chunking + embeddings
│   │   └── db_service.py       # all Supabase queries
│   └── main.py                 # FastAPI entry point
├── frontend/
│   ├── components/
│   │   ├── UploadZone.tsx      # drag & drop upload
│   │   ├── SummaryCard.tsx     # displays notice summary
│   │   ├── ChatBox.tsx         # Q&A chat interface
│   │   └── NoticeSidebar.tsx   # list of uploaded notices
│   └── app/
│       └── page.tsx            # main page
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

### Install Tesseract (Windows)
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. During install, check **"Additional language data → Nepali"**
3. Add `C:\Program Files\Tesseract-OCR` to Windows PATH

### Install Tesseract (Linux/Railway)
```bash
apt-get install -y tesseract-ocr tesseract-ocr-nep
```

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/nepali-notice-reader.git
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
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

Get free API keys from:
- Gemini → https://aistudio.google.com
- Groq → https://console.groq.com
- Supabase → https://supabase.com

### 5. Set up Supabase database
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

### 6. Run the backend
```bash
# from project root
uvicorn backend.main:app --reload
```

API running at: `http://127.0.0.1:8000`
Swagger docs at: `http://127.0.0.1:8000/docs`

### 7. Run the frontend
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
| POST | `/upload` | Upload notice image → returns summary |
| GET | `/summarize/{notice_id}` | Get summary for existing notice |
| GET | `/embed/notices/{user_id}` | Get all notices for a user |
| PATCH | `/embed/switch/{user_id}/{notice_id}` | Switch active notice |
| POST | `/chat` | Ask a question about a notice |

### POST /upload
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@notice.png" \
  -F "email=user@example.com"
```

### POST /chat
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"notice_id": "your-notice-id", "question": "What is the deadline?"}'
```

---

## 🗄️ Database Schema

```sql
users          — stores user accounts
notices        — stores uploaded notices + translations + summaries
notice_chunks  — stores text chunks + 768-dim embeddings (pgvector)
conversations  — stores chat history per notice
```

---

## 🚢 Deployment

### Backend (Railway)
1. Push code to GitHub
2. Create new project at https://railway.app
3. Connect your GitHub repo
4. Add environment variables from `.env`
5. Add `nixpacks.toml` for Tesseract:
```toml
[phases.setup]
nixPkgs = ["tesseract", "tesseract-data-nep"]
```
6. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Push `frontend/` to GitHub
2. Import project at https://vercel.com
3. Update API URLs from `127.0.0.1:8000` to your Railway backend URL
4. Deploy

---

## 🔮 Future improvements

- User authentication (JWT)
- PDF support
- Search across multiple notices
- Email notifications for deadlines
- Mobile app
- Nepali language output option

---

## 👨‍💻 Author

Built by ShtSushan — May 2026