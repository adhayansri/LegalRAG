# LegalRAG

This repository contains a prototype Retrieval-Augmented-Generation (RAG) legal assistant.

Repository layout (important paths)
- `backend/` — Django backend with the chat API and RAG logic (retrieval + generation).
	- `backend/chatbot/rag.py` — primary RAG entrypoint used by the API (retrieval, chunk merging, deduplication, Gemini generation, fallback).
	- `backend/manage.py`, `backend/requirements.txt` — Django project files.
- `chroma_db/` — persisted Chroma DB files (may be large; do not accidentally delete).
- `build_index.py` — script that creates/updates `chroma_db/` from `data/` and `chunks.json`.
- `ask.py`, `legal_rag_fixed.py` — earlier scripts and helpers used during development.
- `frontend/` — React + Vite frontend.

Quick start (backend)

1. Create a Python virtual environment and activate it (recommended):

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. Install backend dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

3. Environment variables (at minimum):
- `GEMINI_API_KEY` — required to call Google Gemini via `google.generativeai` (used in `backend/chatbot/rag.py`).
- `CHROMA_DB_PATH` — optional path to your `chroma_db` directory. If unset, the backend will attempt several sensible default locations (project `chroma_db/`, repo-root `chroma_db/`).

Set env vars (example, Windows PowerShell):

```powershell
$env:GEMINI_API_KEY = "your_key_here"
$env:CHROMA_DB_PATH = "C:\path\to\chroma_db"
```

4. Prepare the database and run the server:

```bash
cd backend
python manage.py migrate
python manage.py runserver 8000
```

If the API is reachable at `http://localhost:8000`, the chat endpoint is provided by the Django app (see backend code for routes).

Indexing notes
- Use `python build_index.py` from the repository root to (re)build `chroma_db/` from the `data/` folder. This must be run if the knowledge base is empty or you add new documents.

Frontend

1. Install and run the frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

2. The frontend dev server is configured to proxy `/api` requests to the backend (see `frontend` config). Ensure the backend is running on the expected port.

Behavior & features (preserved in backend)
- Greeting classifier: short query detection for greetings (keeps behavior consistent).
- Chroma retrieval: uses sentence-transformers embeddings and ChromaDB for nearest-neighbour retrieval.
- Chunk merging & deduplication: contiguous chunk merging and de-duplication by (act, section) are implemented in `backend/chatbot/rag.py`.
- Gemini generation: uses `google.generativeai` (`GEMINI_API_KEY`) when retrieved context is available.
- Fallback mode: when generation fails or no context available, a fallback synthesised snippet response is returned.
- Logging: exceptions are logged and the API returns safe fallback messages instead of raising.

Troubleshooting
- If Django raises import errors for retrieval libraries, ensure `sentence-transformers` and `chromadb` are installed in the same Python environment used to run Django.
- If the backend cannot find a populated Chroma DB, run `python build_index.py` and set `CHROMA_DB_PATH` to the resulting folder.
- For Gemini errors, verify `GEMINI_API_KEY` is present and valid.

Contributing
- Do not commit large binary DB files from `chroma_db/`. Add them to `.gitignore` if appropriate.
