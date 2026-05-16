#!/bin/bash

# ─────────────────────────────────────────
#   Nepal Notice Reader — Project Setup
# ─────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setting up: Nepal Notice Reader"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Frontend folders ──
mkdir -p frontend/components
mkdir -p frontend/app

# ── 2. Frontend files ──
touch frontend/components/UploadZone.tsx
touch frontend/components/SummaryCard.tsx
touch frontend/components/ChatBox.tsx
touch frontend/components/NoticeSidebar.tsx
touch frontend/app/page.tsx

# ── 3. Backend folders ──
mkdir -p backend/routers
mkdir -p backend/services
mkdir -p backend/prompts

# ── 4. Backend files ──
touch backend/routers/upload.py
touch backend/routers/summarize.py
touch backend/routers/embed.py
touch backend/routers/chat.py

touch backend/services/gemini_service.py
touch backend/services/groq_service.py
touch backend/services/embed_service.py
touch backend/services/db_service.py

touch backend/prompts/templates.py

touch backend/main.py

# ── 5. DB folder and schema ──
mkdir -p db
touch db/schema.sql

# ── 6. Root level files ──
touch .env
touch .gitignore

# ── 7. .gitignore ──
cat > .gitignore << 'EOF'
venv/
.env
__pycache__/
*.pyc
.DS_Store
uploads/
.ipynb_checkpoints/
node_modules/
.next/
EOF

echo ""
echo "  Directory and files created successfully"
echo ""
echo "  nepali-notice-reader/"
echo "  ├── frontend/"
echo "  │   ├── components/"
echo "  │   │   ├── UploadZone.tsx"
echo "  │   │   ├── SummaryCard.tsx"
echo "  │   │   ├── ChatBox.tsx"
echo "  │   │   └── NoticeSidebar.tsx"
echo "  │   └── app/"
echo "  │       └── page.tsx"
echo "  ├── backend/"
echo "  │   ├── routers/"
echo "  │   │   ├── upload.py"
echo "  │   │   ├── summarize.py"
echo "  │   │   ├── embed.py"
echo "  │   │   └── chat.py"
echo "  │   ├── services/"
echo "  │   │   ├── gemini_service.py"
echo "  │   │   ├── groq_service.py"
echo "  │   │   ├── embed_service.py"
echo "  │   │   └── db_service.py"
echo "  │   ├── prompts/"
echo "  │   │   └── templates.py"
echo "  │   └── main.py"
echo "  ├── db/"
echo "  │   └── schema.sql"
echo "  ├── .env"
echo "  └── .gitignore"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"